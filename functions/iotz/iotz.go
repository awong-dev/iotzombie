package iotz

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	firebase "firebase.google.com/go"
	auth "firebase.google.com/go/auth"
	database "firebase.google.com/go/db"
	"fmt"
	identitytoolkit "google.golang.org/api/identitytoolkit/v3"
	"log"
	"net/http"
	"regexp"
)

var app *firebase.App
var client *auth.Client
var db *database.Client
var devIdRegex = regexp.MustCompile("^[a-zA-Z0-9_-]+$")

func init() {
	var err error
	app, err = firebase.NewApp(context.Background(), nil)
	if err != nil {
		log.Fatalf("error initializing app: %v\n", err)
	}

	client, err = app.Auth(context.Background())
	if err != nil {
		log.Fatalf("error getting Auth client: %v\n", err)
	}

	db, err = app.DatabaseWithURL(context.Background(),
		"https://iotzombie-153122.firebaseio.com")
	if err != nil {
		log.Fatalf("error getting Database client: %v\n", err)
	}
}

// Creates a signed JWT token suitable for use as authentication to the firebase DB.
func GetFirebaseIdToken(w http.ResponseWriter, r *http.Request) {
	// Verify the request params and authenticate first.
	query := r.URL.Query()

	// Grab all the parameters
	deviceId := query.Get("device_id")
	if deviceId == "" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Missing device_id"))
		return
	}
	matches := devIdRegex.MatchString(deviceId)
	if !matches {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("device_id must be [a-zA-Z0-9_-]+"))
		return
	}

	hmac := query.Get("hmac")
	if hmac == "" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Missing hmac"))
		return
	}
	alg := query.Get("alg")
	if alg == "" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Missing alg"))
		return
	}
	if alg != "sha256" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Only supports sha256 for now"))
		return
	}

	// Find the device secret.
	ctx := context.Background()
	var secret string
	err := db.NewRef("authn/devices/"+deviceId).Get(ctx, &secret)
	if err != nil {
		log.Fatal(err)
	}

	hasher := sha256.New()
	var toHash = []byte("alg=" + alg + "&device_id=" + deviceId + "&secret=" + secret)
	hasher.Write(toHash)
	calcuatedHmac := hex.EncodeToString(hasher.Sum(nil))
	if calcuatedHmac != hmac {
		log.Printf("toHash: %v, result: %v, received: %v", toHash, calcuatedHmac, hmac)
		w.WriteHeader(http.StatusForbidden)
		w.Write([]byte("invalid signature"))
		return
	}

	// Generate a custom JWT for the given user id signed by our service account.
	token, err := client.CustomToken(ctx, "device-"+deviceId)
	if err != nil {
		log.Fatalf("error minting custom token: %v\n", err)
	}

	// Exchange that custom token for a signed Firebase ID JWT.
	identitytoolkitService, err := identitytoolkit.NewService(ctx)
	relyingPartySerivce := identitytoolkit.NewRelyingpartyService(identitytoolkitService)

	request := identitytoolkit.IdentitytoolkitRelyingpartyVerifyCustomTokenRequest{ReturnSecureToken: true, Token: token}
	response, err := relyingPartySerivce.VerifyCustomToken(&request).Do()
	if err != nil {
		log.Fatalf("error verifying custom token: %v\n", err)
	}

	// Return the data in JSON format.
	// TODO(awong): What is refresh_token here for??
	fmt.Fprintf(w, "{ 'id_token': '%v', 'refresh_token': '%v', 'expires_in': %v, 'is_new_user': %v }",
		response.IdToken, response.RefreshToken, response.ExpiresIn, response.IsNewUser)
}

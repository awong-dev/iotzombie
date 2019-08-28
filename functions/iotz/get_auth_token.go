package iotz

import (
	"context"
	firebase "firebase.google.com/go"
	auth "firebase.google.com/go/auth"
	"fmt"
	identitytoolkit "google.golang.org/api/identitytoolkit/v3"
	"log"
	"net/http"
)

var client *auth.Client

func init() {
	app, err := firebase.NewApp(context.Background(), nil)
	if err != nil {
		log.Fatalf("error initializing app: %v\n", err)
	}

	client, err = app.Auth(context.Background())
	if err != nil {
		log.Fatalf("error getting Auth client: %v\n", err)
	}
}

// Creates a signed JWT token suitable for use as authentication to the firebase DB.
func GetFirebaseDbToken(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	token, err := client.CustomToken(ctx, "some-uid")
	if err != nil {
		log.Fatalf("error minting custom token: %v\n", err)
	}
	identitytoolkitService, err := identitytoolkit.NewService(ctx)
	relyingPartySerivce := identitytoolkit.NewRelyingpartyService(identitytoolkitService)

	request := identitytoolkit.IdentitytoolkitRelyingpartyVerifyCustomTokenRequest{ReturnSecureToken: true, Token: token}
	response, err := relyingPartySerivce.VerifyCustomToken(&request).Do()
	if err != nil {
		log.Fatalf("error verifying custom token: %v\n", err)
	}

	fmt.Fprintf(w, "{ 'id_token': '%v', 'refresh_token': '%v', 'expires_in': %v, 'is_new_user': %v }", response.IdToken, response.RefreshToken, response.ExpiresIn, response.IsNewUser)
}

package iotz

import (
	"context"
	firebase "firebase.google.com/go"
	auth "firebase.google.com/go/auth"
	"fmt"
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
	token, err := client.CustomToken(context.Background(), "some-uid")
	if err != nil {
		log.Fatalf("error minting custom token: %v\n", err)
	}

	fmt.Fprint(w, "Hello, World! %v", token)
}

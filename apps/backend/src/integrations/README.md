# Integrations

Integration modules own third-party API details. Feature modules should import
these clients instead of hiding provider-specific code inside business logic.

Current integrations:

- `africastalking`: SMS provider setup and dispatch.
- `ai`: Gemini function calling, Gemini Vision, and Google Cloud Vision clients.
- `cloudinary`: media upload client and provider-specific transformations.
- `meta-whatsapp`: Meta WhatsApp Cloud API message send and media download.
- `paystack`: transactions, transfers, bank/account resolution, recipients, and
  dedicated virtual accounts.
- `resend`: transactional email delivery.

Use this area when provider code is shared by multiple domains or needs its own
debugging, mocking, retries, or provider-specific error handling.

Integration clients should read provider settings through named config
namespaces (`paystack.*`, `whatsapp.*`, `ai.*`, `cloudinary.*`, etc.). Feature,
domain, and channel services should not read raw provider env vars or call
provider HTTP endpoints directly.

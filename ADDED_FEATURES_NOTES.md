# Added Book Metadata Features

## Features added
- Google Books API lookup by ISBN
- Open Library fallback lookup by ISBN
- Autofill when typing or scanning ISBN on the donate page
- Optional camera-based ISBN barcode scanning using the browser BarcodeDetector API
- Auto-population of cover image, description, page count, published year, language, category, and normalized ISBN
- Backend enrichment fallback during book creation when an ISBN is submitted

## Notes
- `GOOGLE_BOOKS_API_KEY` is optional in `backend/.env.example`. The Google Books lookup works best with a key but will still attempt public requests without one.
- If a donor uploads their own image, it overrides the API-provided cover image.
- Camera scan support depends on browser support for `BarcodeDetector` and camera permissions.

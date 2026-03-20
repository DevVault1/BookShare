# Changed files for public book reviews update

Applied on top of the uploaded `BookShare-development (1).zip` project.

## Backend
- `backend/models/Book.js`
- `backend/models/Review.js` (new)
- `backend/controllers/bookController.js`
- `backend/controllers/reviewController.js` (new)
- `backend/routes/reviews.js` (new)
- `backend/server.js`

## Web
- `web/app/books/[id]/page.tsx`
- `web/components/books/BookCard.tsx`
- `web/components/reviews/StarDisplay.tsx` (new)
- `web/components/reviews/StarRatingInput.tsx` (new)
- `web/components/reviews/ReviewForm.tsx` (new)
- `web/components/reviews/ReviewCard.tsx` (new)

## Behavior added
- Any logged-in user can submit one review per book.
- Each review includes a 1 to 5 star rating and written comment.
- Reviews are publicly visible on the book detail page.
- Users can edit or delete only their own review.
- Each book stores and displays `ratingsAverage` and `ratingsCount`.
- Book cards and book detail pages now show average rating information.

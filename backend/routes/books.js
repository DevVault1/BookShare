const router = require('express').Router();
const {
  getBooks, getBook, createBook, updateBook, deleteBook, getUserBooks, getRecommendations
} = require('../controllers/bookController');
const { auth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.get('/', getBooks);
router.get('/my-books', auth, getUserBooks);
router.get('/recommendations', auth, getRecommendations);
router.get('/:id', getBook);
router.post('/', auth, upload.single('image'), createBook);
router.put('/:id', auth, upload.single('image'), updateBook);
router.delete('/:id', auth, deleteBook);

module.exports = router;

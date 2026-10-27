import 'package:flutter/material.dart';
import '../data/models/book_model.dart';
import '../data/services/book_service.dart';

class BookProvider extends ChangeNotifier {
  final BookService _bookService = BookService();

  List<BookModel> _allBooks = [];
  List<BookModel> _filteredBooks = [];
  String _selectedCategory = 'All';
  String _searchQuery = '';
  bool _isLoading = false;
  String? _errorMessage;

  List<BookModel> get books => _filteredBooks;
  List<BookModel> get allBooks => _allBooks;
  String get selectedCategory => _selectedCategory;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  final List<String> categories = [
    'All',
    'Engineering',
    'Medical',
    'Management',
    'Law',
    'Arts & Science',
    'Exam Prep',
    'Novels',
  ];

  Future<void> loadBooks() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _allBooks = await _bookService.fetchBooks();
      _applyFilter();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
    }
  }

  void setCategory(String category) {
    _selectedCategory = category;
    _applyFilter();
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query.toLowerCase().trim();
    _applyFilter();
    notifyListeners();
  }

  void _applyFilter() {
    _filteredBooks = _allBooks.where((book) {
      final matchesCategory = _selectedCategory == 'All' ||
          book.category.toLowerCase() == _selectedCategory.toLowerCase();

      final matchesSearch = _searchQuery.isEmpty ||
          book.title.toLowerCase().contains(_searchQuery) ||
          book.author.toLowerCase().contains(_searchQuery) ||
          book.location.toLowerCase().contains(_searchQuery);

      return matchesCategory && matchesSearch;
    }).toList();
  }

  Future<bool> addBook({
    required String title,
    required String author,
    required String price,
    required String category,
    required String location,
    required String seller,
    required String uploaderEmail,
    List<String> imagePaths = const [],
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final success = await _bookService.addBook(
        title: title,
        author: author,
        price: price,
        category: category,
        location: location,
        seller: seller,
        uploaderEmail: uploaderEmail,
        imagePaths: imagePaths,
      );
      if (success) {
        await loadBooks();
      }
      _isLoading = false;
      notifyListeners();
      return success;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}

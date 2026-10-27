import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/api_endpoints.dart';
import '../models/book_model.dart';

class BookService {
  // Fetch all books
  Future<List<BookModel>> fetchBooks() async {
    final response = await http.get(Uri.parse(ApiEndpoints.getBooks));

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((item) => BookModel.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load books: ${response.statusCode}');
    }
  }

  // Add book with multipart images
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
    final request = http.MultipartRequest('POST', Uri.parse(ApiEndpoints.addBook));

    request.fields['title'] = title;
    request.fields['author'] = author;
    request.fields['writer'] = author;
    request.fields['price'] = price;
    request.fields['category'] = category;
    request.fields['location'] = location;
    request.fields['seller'] = seller;
    request.fields['uploaderEmail'] = uploaderEmail;

    for (var path in imagePaths) {
      if (path.isNotEmpty) {
        request.files.add(await http.MultipartFile.fromPath('images', path));
      }
    }

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200 || response.statusCode == 201) {
      return true;
    } else {
      final data = jsonDecode(response.body);
      throw Exception(data['message'] ?? 'Failed to list book');
    }
  }
}

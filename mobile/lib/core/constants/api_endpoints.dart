class ApiEndpoints {
  // Use your live deployed Render backend URL
  static const String baseUrl = 'https://swaptome-api.onrender.com';

  // Auth endpoints
  static const String login = '$baseUrl/api/auth/login';
  static const String signup = '$baseUrl/api/auth/signup';
  static const String resendVerification = '$baseUrl/api/auth/resend-verification';
  static const String forgotPassword = '$baseUrl/api/auth/forgot-password';
  static const String googleAuth = '$baseUrl/api/auth/google';

  // Book endpoints
  static const String getBooks = '$baseUrl/api/books';
  static const String addBook = '$baseUrl/add-book';
  static const String userBooks = '$baseUrl/api/books/my';
  static String deleteBook(String id) => '$baseUrl/api/books/$id';

  // Chat & Messages endpoints
  static String getInbox(String username) => '$baseUrl/inbox/$username';
  static String getConversation(String u1, String u2) => '$baseUrl/messages/$u1/$u2';
  static const String sendMessage = '$baseUrl/send-message';
}

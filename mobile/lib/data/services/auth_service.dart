import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/api_endpoints.dart';
import '../models/user_model.dart';

class AuthService {
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'auth_user';

  // Login
  Future<UserModel> login(String email, String password) async {
    final response = await http.post(
      Uri.parse(ApiEndpoints.login),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email.trim(), 'password': password}),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      final token = data['token'];
      final user = UserModel(
        id: data['userId'] ?? data['_id'] ?? '',
        name: data['name'] ?? '',
        email: data['email'] ?? email,
        role: data['role'] ?? 'user',
        isVerified: true,
        token: token,
      );

      await saveSession(user, token);
      return user;
    } else {
      throw Exception(data['message'] ?? 'Login failed');
    }
  }

  // Signup
  Future<String> signup({
    required String name,
    required String email,
    required String password,
    String? college,
    String? location,
  }) async {
    final response = await http.post(
      Uri.parse(ApiEndpoints.signup),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name.trim(),
        'email': email.trim(),
        'password': password,
        'college': college?.trim() ?? '',
        'location': location?.trim() ?? '',
      }),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200 || response.statusCode == 201) {
      return data['message'] ?? 'Verification link sent to your email!';
    } else {
      throw Exception(data['message'] ?? 'Signup failed');
    }
  }

  // Resend verification email
  Future<String> resendVerification(String email) async {
    final response = await http.post(
      Uri.parse(ApiEndpoints.resendVerification),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email.trim()}),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200) {
      return data['message'] ?? 'Verification link resent!';
    } else {
      throw Exception(data['message'] ?? 'Failed to resend verification');
    }
  }

  // Forgot password
  Future<String> forgotPassword(String email) async {
    final response = await http.post(
      Uri.parse(ApiEndpoints.forgotPassword),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email.trim()}),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200) {
      return data['message'] ?? 'Password reset link sent to your email!';
    } else {
      throw Exception(data['message'] ?? 'Failed to send reset link');
    }
  }

  // Save session locally
  Future<void> saveSession(UserModel user, String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
  }

  // Load saved session
  Future<UserModel?> getSavedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    final userJson = prefs.getString(_userKey);

    if (token != null && userJson != null) {
      return UserModel.fromJson(jsonDecode(userJson), token: token);
    }
    return null;
  }

  // Clear session
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }
}

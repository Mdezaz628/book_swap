import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/api_endpoints.dart';
import '../models/message_model.dart';

class ChatService {
  // Fetch messages between two users
  Future<List<MessageModel>> fetchConversation(String user1, String user2) async {
    final response = await http.get(Uri.parse(ApiEndpoints.getConversation(user1, user2)));

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((item) => MessageModel.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load conversation');
    }
  }

  // Send message
  Future<bool> sendMessage({
    required String sender,
    required String receiver,
    required String message,
  }) async {
    final response = await http.post(
      Uri.parse(ApiEndpoints.sendMessage),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'sender': sender,
        'receiver': receiver,
        'message': message,
      }),
    );

    return response.statusCode == 200 || response.statusCode == 201;
  }
}

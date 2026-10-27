class UserModel {
  final String id;
  final String name;
  final String email;
  final String? college;
  final String? location;
  final String role;
  final bool isVerified;
  final String? token;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.college,
    this.location,
    this.role = 'user',
    this.isVerified = false,
    this.token,
  });

  factory UserModel.fromJson(Map<String, dynamic> json, {String? token}) {
    return UserModel(
      id: json['_id'] ?? json['id'] ?? json['userId'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      college: json['college'],
      location: json['location'],
      role: json['role'] ?? 'user',
      isVerified: json['isVerified'] ?? false,
      token: token ?? json['token'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'email': email,
      'college': college,
      'location': location,
      'role': role,
      'isVerified': isVerified,
      'token': token,
    };
  }
}

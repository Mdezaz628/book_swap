class BookModel {
  final String id;
  final String title;
  final String author;
  final num price;
  final String category;
  final String location;
  final String seller;
  final String? uploaderEmail;
  final List<String> images;
  final bool featured;
  final DateTime? createdAt;

  BookModel({
    required this.id,
    required this.title,
    required this.author,
    required this.price,
    required this.category,
    required this.location,
    required this.seller,
    this.uploaderEmail,
    required this.images,
    this.featured = false,
    this.createdAt,
  });

  factory BookModel.fromJson(Map<String, dynamic> json) {
    List<String> parsedImages = [];
    if (json['images'] is List) {
      parsedImages = (json['images'] as List)
          .map((img) => img.toString())
          .where((img) => img.isNotEmpty)
          .toList();
    } else if (json['image'] is String && json['image'].isNotEmpty) {
      parsedImages = [json['image']];
    }

    return BookModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? json['name'] ?? 'Untitled Book',
      author: json['author'] ?? json['writer'] ?? 'Unknown Author',
      price: json['price'] ?? 0,
      category: json['category'] ?? 'General',
      location: json['location'] ?? 'Location not shared',
      seller: json['seller'] ?? 'Seller',
      uploaderEmail: json['uploaderEmail'],
      images: parsedImages,
      featured: json['featured'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
    );
  }

  String get firstImageUrl {
    if (images.isNotEmpty) {
      return images.first;
    }
    return 'https://via.placeholder.com/300x400?text=No+Cover';
  }
}

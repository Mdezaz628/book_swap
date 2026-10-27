import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii } from '../constants/theme';
import { ENDPOINTS } from '../constants/api';

const CATEGORIES = [
  'Fiction',
  'Academic',
  'Non-Fiction',
  'Technology',
  'Comics',
  'Self-Help',
  'Business',
  'Other',
];

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

export default function SellScreen({ onSuccess }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Fiction');
  const [condition, setCondition] = useState('Like New');
  const [isSwap, setIsSwap] = useState(true);
  const [price, setPrice] = useState('');
  const [swapFor, setSwapFor] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow gallery access to upload book photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow camera access to take book photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not launch camera.');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Please provide a book title.');
      return;
    }
    if (!author.trim()) {
      Alert.alert('Validation', 'Please provide author name.');
      return;
    }
    if (!isSwap && (!price || Number(price) <= 0)) {
      Alert.alert('Validation', 'Please enter a valid price for sale.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('author', author.trim());
      formData.append('category', category);
      formData.append('condition', condition);
      formData.append('price', isSwap ? '0' : price.trim());
      formData.append('swapFor', isSwap ? (swapFor.trim() || 'Open to offers') : '');
      formData.append('location', location.trim() || 'Campus Community');
      formData.append('description', description.trim());

      if (imageUri) {
        const filename = imageUri.split('/').pop() || 'book_cover.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
          uri: imageUri,
          name: filename,
          type,
        });
      }

      const res = await fetch(ENDPOINTS.books, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.ok) {
        Alert.alert('Success! 🎉', 'Your book has been listed on SwapToMe!');
        // Reset form
        setTitle('');
        setAuthor('');
        setPrice('');
        setSwapFor('');
        setLocation('');
        setDescription('');
        setImageUri(null);
        if (onSuccess) onSuccess();
      } else {
        const errorData = await res.json().catch(() => ({}));
        Alert.alert('Upload Failed', errorData.message || 'Server error occurred.');
      }
    } catch (err) {
      Alert.alert('Network Error', 'Could not reach server. Please check your internet connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>List a Book</Text>
        <Text style={styles.subtitle}>Put your book up for swap or sell it to someone nearby</Text>
      </View>

      {/* Photo Picker */}
      <View style={styles.imageSection}>
        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={40} color={Colors.textSubtle} />
            <Text style={styles.imagePlaceholderText}>Upload Book Cover</Text>
            <View style={styles.imageButtonRow}>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                <Ionicons name="images-outline" size={16} color={Colors.primary} />
                <Text style={styles.imagePickerBtnText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={16} color={Colors.primary} />
                <Text style={styles.imagePickerBtnText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Form Fields */}
      <View style={styles.form}>
        <Text style={styles.label}>Book Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Clean Code, Sapiens"
          placeholderTextColor={Colors.textSubtle}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Author *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Robert C. Martin"
          placeholderTextColor={Colors.textSubtle}
          value={author}
          onChangeText={setAuthor}
        />

        {/* Category Pills */}
        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.pill, category === cat && styles.pillActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Condition Pills */}
        <Text style={styles.label}>Condition</Text>
        <View style={styles.pillRow}>
          {CONDITIONS.map((cond) => (
            <TouchableOpacity
              key={cond}
              style={[styles.pill, condition === cond && styles.pillActive]}
              onPress={() => setCondition(cond)}
            >
              <Text style={[styles.pillText, condition === cond && styles.pillTextActive]}>{cond}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Listing Type Toggle */}
        <Text style={styles.label}>Listing Type</Text>
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, isSwap && styles.toggleBtnActive]}
            onPress={() => setIsSwap(true)}
          >
            <Ionicons name="repeat" size={16} color={isSwap ? '#FFF' : Colors.text} />
            <Text style={[styles.toggleBtnText, isSwap && styles.toggleBtnTextActive]}>
              Swap / Exchange
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !isSwap && styles.toggleBtnActive]}
            onPress={() => setIsSwap(false)}
          >
            <Ionicons name="cash-outline" size={16} color={!isSwap ? '#FFF' : Colors.text} />
            <Text style={[styles.toggleBtnText, !isSwap && styles.toggleBtnTextActive]}>
              Sell for Cash
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conditional Price / Swap Wishlist */}
        {isSwap ? (
          <View>
            <Text style={styles.label}>Books you want in return (Wishlist)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sci-Fi novels, Python books, or any offer"
              placeholderTextColor={Colors.textSubtle}
              value={swapFor}
              onChangeText={setSwapFor}
            />
          </View>
        ) : (
          <View>
            <Text style={styles.label}>Price (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 199"
              placeholderTextColor={Colors.textSubtle}
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>
        )}

        <Text style={styles.label}>Location / Campus</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. North Campus, Library, Downtown"
          placeholderTextColor={Colors.textSubtle}
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.label}>Description & Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Add details about notes, highlights, edition, etc."
          placeholderTextColor={Colors.textSubtle}
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Publish Listing</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
  },
  imageSection: {
    marginBottom: 20,
  },
  previewContainer: {
    width: '100%',
    height: 220,
    borderRadius: Radii.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.borderLight,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  imagePlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
    marginTop: 6,
    marginBottom: 10,
  },
  imageButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.sm,
    gap: 6,
  },
  imagePickerBtnText: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  form: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
  },
  pillTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.borderLight,
    padding: 4,
    borderRadius: Radii.md,
    marginBottom: 8,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.sm,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
  },
  toggleBtnTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radii.md,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

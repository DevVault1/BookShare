import React, { useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { AppScreen } from '../../components/ui/AppScreen';
import { FormInput } from '../../components/ui/FormInput';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { TagChip } from '../../components/ui/TagChip';
import { BOOK_CATEGORIES, BOOK_CONDITIONS } from '../../utils/constants';
import { booksApi } from '../../api/services';
import { extractApiError } from '../../api/client';
import { getAppColors, type AppColors } from '../../theme/colors';

interface PickedImage {
  uri: string;
  type?: string;
  fileName?: string;
}

const initialForm = {
  title: '',
  author: '',
  description: '',
  category: 'Fiction',
  condition: 'Good',
  location: '',
  isbn: '',
  language: 'English',
  pages: '',
  publishedYear: '',
  tags: '',
  externalImageUrl: '',
};

export const DonateBookScreen = () => {
  const colors = getAppColors(useColorScheme());
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState<PickedImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lookupInfo, setLookupInfo] = useState('');

  const update = (key: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const pickImage = async () => {
    const response = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
    });

    const asset = response.assets?.[0];
    if (!asset?.uri) return;
    setImage({ uri: asset.uri, type: asset.type, fileName: asset.fileName });
    update('externalImageUrl', '');
  };

  const lookupIsbn = async () => {
    if (!form.isbn.trim()) {
      setError('Please enter an ISBN first.');
      return;
    }

    setBusy(true);
    setError('');
    setLookupInfo('');
    try {
      const result = await booksApi.lookupIsbn(form.isbn.trim());
      setForm((previous) => ({
        ...previous,
        title: result.book?.title || previous.title,
        author: result.book?.author || previous.author,
        description: result.book?.description || previous.description,
        category: result.book?.category || previous.category,
        language: result.book?.language || previous.language,
        publishedYear: result.book?.publishedYear ? String(result.book.publishedYear) : previous.publishedYear,
        pages: result.book?.pages ? String(result.book.pages) : previous.pages,
        externalImageUrl: result.book?.image || previous.externalImageUrl,
      }));
      setLookupInfo(result.message || 'Book metadata loaded from ISBN sources.');
      if (result.book?.image) setImage(null);
    } catch (lookupError: unknown) {
      setError(extractApiError(lookupError, 'Failed to lookup ISBN metadata'));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!form.title.trim() || !form.author.trim()) {
      setError('Title and author are required.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value.trim()) {
          body.append(key, value.trim());
        }
      });

      if (image?.uri) {
        body.append('image', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.fileName || `book-${Date.now()}.jpg`,
        } as never);
      }

      await booksApi.createBook(body);
      Alert.alert('Success', 'Book listing created successfully.');
      setForm(initialForm);
      setImage(null);
      setLookupInfo('');
    } catch (submitError: unknown) {
      setError(extractApiError(submitError, 'Failed to publish listing'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen
      title="Donate a Book"
      subtitle="Create a rich listing with ISBN autofill, cover image, and detailed metadata."
    >
      <View style={styles.card}>
        <FormInput label="Title" value={form.title} onChangeText={(v) => update('title', v)} />
        <FormInput label="Author" value={form.author} onChangeText={(v) => update('author', v)} />

        <Text style={styles.label}>Category</Text>
        <View style={styles.chipWrap}>
          {BOOK_CATEGORIES.map((item) => (
            <TagChip
              key={item}
              label={item}
              selected={form.category === item}
              onPress={() => update('category', item)}
            />
          ))}
        </View>

        <Text style={styles.label}>Condition</Text>
        <View style={styles.chipWrap}>
          {BOOK_CONDITIONS.map((item) => (
            <TagChip
              key={item}
              label={item}
              selected={form.condition === item}
              onPress={() => update('condition', item)}
            />
          ))}
        </View>

        <FormInput label="Location" value={form.location} onChangeText={(v) => update('location', v)} />
        <FormInput label="Language" value={form.language} onChangeText={(v) => update('language', v)} />
        <FormInput label="ISBN" value={form.isbn} onChangeText={(v) => update('isbn', v)} />
        <FormInput label="Published Year" value={form.publishedYear} onChangeText={(v) => update('publishedYear', v)} keyboardType="number-pad" />
        <FormInput label="Pages" value={form.pages} onChangeText={(v) => update('pages', v)} keyboardType="number-pad" />
        <FormInput label="Tags (comma separated)" value={form.tags} onChangeText={(v) => update('tags', v)} />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.textArea}
          value={form.description}
          onChangeText={(v) => update('description', v)}
          multiline
          placeholder="Describe condition and reading suitability"
          placeholderTextColor={colors.mutedForeground}
        />

        <PrimaryButton label="Lookup ISBN Metadata" variant="secondary" onPress={lookupIsbn} disabled={busy} />

        <View style={styles.spacer} />

        <PrimaryButton label="Pick Cover Image" variant="ghost" onPress={pickImage} disabled={busy} />

        {form.externalImageUrl ? <Image source={{ uri: form.externalImageUrl }} style={styles.preview} /> : null}
        {image?.uri ? <Image source={{ uri: image.uri }} style={styles.preview} /> : null}

        {lookupInfo ? <Text style={styles.info}>{lookupInfo}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton label="Publish Listing" onPress={submit} loading={busy} />
      </View>
    </AppScreen>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
  },
  label: {
    color: colors.secondaryForeground,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 4,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  textArea: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: 12,
    backgroundColor: colors.card,
    color: colors.foreground,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
    textAlignVertical: 'top',
  },
  spacer: {
    height: 8,
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: colors.imagePlaceholder,
  },
  info: {
    color: colors.success,
    backgroundColor: colors.successSurface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    fontSize: 13,
  },
  error: {
    color: colors.destructive,
    marginBottom: 8,
  },
});

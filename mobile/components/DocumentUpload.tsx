import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'

interface DocumentUploadProps {
  documentType: string
  label: string
  onUploadComplete: (url: string) => void
  existingUrl?: string
}

export default function DocumentUpload({
  documentType,
  label,
  onUploadComplete,
  existingUrl
}: DocumentUploadProps) {
  const { guard: authGuard } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState(existingUrl || '')
  const [error, setError] = useState('')

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
        copyToCacheDirectory: true,
      })

      if (result.canceled) return

      const file = result.assets[0]

      // Validate file size (max 5MB)
      if (file.size && file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        Alert.alert('File Too Large', 'Please select a file smaller than 5MB')
        return
      }

      await uploadFile(file)
    } catch (err) {
      console.error('File pick error:', err)
      setError('Failed to select file')
    }
  }

  const uploadFile = async (file: any) => {
    setUploading(true)
    setError('')

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'

      // Create form data
      const formData = new FormData()
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType,
        name: file.name,
      } as any)
      formData.append('documentType', documentType)
      formData.append('userId', authGuard?.guardPublicId || 'unknown')

      // Upload to backend
      const response = await fetch(`${apiUrl}/api/upload/document`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.url) {
        setUploadedUrl(data.url)
        onUploadComplete(data.url)
        Alert.alert('Success', 'Document uploaded successfully')
      } else {
        throw new Error('Upload failed')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Upload failed. Please try again.')
      Alert.alert('Upload Failed', 'Could not upload document. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setUploadedUrl('')
            onUploadComplete('')
          }
        }
      ]
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label} (Optional)</Text>

      {uploadedUrl ? (
        <View style={styles.uploadedContainer}>
          <View style={styles.successRow}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.successText}>Document uploaded</Text>
          </View>
          <TouchableOpacity
            onPress={handleRemove}
            style={styles.removeButton}
            disabled={uploading}
          >
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <TouchableOpacity
            onPress={handleFilePick}
            disabled={uploading}
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          >
            {uploading ? (
              <View style={styles.uploadingRow}>
                <ActivityIndicator size="small" color="#5B94D3" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            ) : (
              <View style={styles.uploadRow}>
                <Ionicons name="cloud-upload-outline" size={24} color="#5B94D3" />
                <Text style={styles.uploadButtonText}>Choose File</Text>
              </View>
            )}
          </TouchableOpacity>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Text style={styles.hintText}>JPG, PNG, or PDF • Max 5MB</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  uploadedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: 16,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successText: {
    fontSize: 14,
    color: '#10B981',
    marginLeft: 8,
    fontWeight: '500',
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  removeText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#5B94D3',
    borderRadius: 12,
    padding: 16,
    borderStyle: 'dashed',
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#5B94D3',
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    fontSize: 14,
    color: '#5B94D3',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
})

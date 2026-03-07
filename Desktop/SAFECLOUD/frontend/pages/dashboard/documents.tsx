import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/stores/auth';
import { useCanAccess } from '@/hooks/useCanAccess';
import { useRouter } from 'next/router';

const DocumentsPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, access_token } = useAuth();
  const { canCreate, canEdit, canDelete, canDownload } = useCanAccess();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({ title: '', category: '' });
  const [formData, setFormData] = useState({ 
    title: '', 
    category: '',
    file: null as File | null
  });

  useEffect(() => {
    if (authLoading || !user || !access_token) return;
    fetchDocuments();
  }, [user, authLoading, access_token]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/documents/documents/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(Array.isArray(data.results) ? data.results : data);
      }
    } catch (err) {
      console.error('Error al obtener documentos', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    if (!formData.title.trim() || !formData.file) {
      alert('Por favor completa todos los campos e incluye un archivo');
      return;
    }

    try {
      setUploading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const uploadFormData = new FormData();
      uploadFormData.append('title', formData.title);
      uploadFormData.append('category', formData.category);
      uploadFormData.append('file', formData.file);
      
      const response = await fetch(`${apiUrl}/documents/documents/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        body: uploadFormData,
      });

      if (response.ok) {
        setFormData({ title: '', category: '', file: null });
        setShowForm(false);
        fetchDocuments();
        alert('✅ Documento subido exitosamente');
      } else {
        const err = await response.json();
        alert(`Error: ${err.detail || 'No se pudo subir el documento'}`);
      }
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Error al subir el documento');
    } finally {
      setUploading(false);
    }
  };

  const handleEditDocument = async (docId: string) => {
    if (!editingData.title.trim()) {
      alert('El título no puede estar vacío');
      return;
    }

    try {
      setUploading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/documents/documents/${docId}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingData.title,
          category: editingData.category,
        }),
      });

      if (response.ok) {
        setEditingId(null);
        setEditingData({ title: '', category: '' });
        fetchDocuments();
        alert('✅ Documento actualizado exitosamente');
      } else {
        const err = await response.json();
        alert(`Error: ${err.detail || 'No se pudo actualizar el documento'}`);
      }
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Error al actualizar el documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, docTitle: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar "${docTitle}"?`)) {
      return;
    }

    try {
      setUploading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/documents/documents/${docId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (response.ok) {
        fetchDocuments();
        alert('✅ Documento eliminado exitosamente');
      } else {
        const err = await response.json();
        alert(`Error: ${err.detail || 'No se pudo eliminar el documento'}`);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento');
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando documentos...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Documentos</h1>
            <p className="text-gray-500 mt-2">Almacena y gestiona documentos importantes</p>
          </div>
          {canCreate('DOCUMENTS') && (
            <Button
              variant="primary"
              onClick={() => setShowForm(!showForm)}
            >
              + Subir Documento
            </Button>
          )}
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="mb-8 border-2 border-blue-200 bg-blue-50">
          <h2 className="text-xl font-semibold mb-4">📤 Subir Nuevo Documento</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título del Documento *</label>
              <input
                type="text"
                placeholder="Ej: Especificaciones Técnicas"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
              <input
                type="text"
                placeholder="Ej: Diseño, Implementación, Manual"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Archivo *</label>
              <input
                type="file"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
              />
              {formData.file && (
                <p className="text-sm text-green-600 mt-2">
                  ✅ Archivo seleccionado: {formData.file.name}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="primary" 
                onClick={handleCreateDocument}
                disabled={uploading}
              >
                {uploading ? 'Subiendo...' : 'Subir Documento'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ title: '', category: '', file: null });
                }}
                disabled={uploading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Documents List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.length > 0 ? (
          documents.map((doc: any) => (
            <Card key={doc.id} hoverable className="relative">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">📄 {doc.title}</h3>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-3">{doc.category || 'Sin categoría'}</p>
              
              <div className="space-y-2 mb-4 text-xs text-gray-500">
                <p>📅 {new Date(doc.created_at).toLocaleDateString('es-ES')}</p>
                {doc.versions && doc.versions.length > 0 && (
                  <p>📦 Versión {doc.versions.length}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {doc.category && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {doc.category}
                  </span>
                )}
                {doc.visibility === 'STAFF_ONLY' && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    🔒 Solo Staff
                  </span>
                )}
              </div>

              {editingId === doc.id ? (
                <div className="mt-4 space-y-3 p-3 bg-blue-50 rounded-lg">
                  <input
                    type="text"
                    placeholder="Título"
                    value={editingData.title}
                    onChange={(e) => setEditingData({ ...editingData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Categoría"
                    value={editingData.category}
                    onChange={(e) => setEditingData({ ...editingData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      className="flex-1 text-sm"
                      onClick={() => handleEditDocument(doc.id)}
                      disabled={uploading}
                    >
                      💾 Guardar
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1 text-sm"
                      onClick={() => {
                        setEditingId(null);
                        setEditingData({ title: '', category: '' });
                      }}
                      disabled={uploading}
                    >
                      ✕ Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  {canDownload('DOCUMENTS') && doc.versions && doc.versions.length > 0 && (
                    <Button
                      variant="secondary"
                      className="flex-1 text-sm"
                    >
                      ⬇️ Descargar
                    </Button>
                  )}
                  {canEdit('DOCUMENTS') && (
                    <Button
                      variant="secondary"
                      className="flex-1 text-sm"
                      onClick={() => {
                        setEditingId(doc.id);
                        setEditingData({ title: doc.title, category: doc.category || '' });
                      }}
                      disabled={uploading}
                    >
                      ✏️ Editar
                    </Button>
                  )}
                  {canDelete('DOCUMENTS') && (
                    <Button
                      variant="secondary"
                      className="flex-1 text-sm bg-red-100 text-red-700 hover:bg-red-200"
                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                      disabled={uploading}
                    >
                      🗑️ Eliminar
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 text-lg mb-4">Aún no hay documentos disponibles.</p>
            <p className="text-gray-400 text-sm mb-6">Comienza subiendo tu primer documento para organizarlos en un solo lugar.</p>
            {canCreate('DOCUMENTS') && (
              <Button
                variant="primary"
                onClick={() => setShowForm(true)}
              >
                📤 Subir Mi Primer Documento
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DocumentsPage;

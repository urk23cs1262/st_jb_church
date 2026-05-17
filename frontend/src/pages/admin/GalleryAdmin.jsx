import AdminCRUD from '../../components/admin/AdminCRUD';
export default function AdminGallery() {
  return <AdminCRUD resource="gallery" title="Gallery" fields={[
    { name: 'title', label: 'Title', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'category', label: 'Category', type: 'select', options: ['church','feast','events','priests','community','other'] },
    { name: 'album', label: 'Album Name' },
    { name: 'isPublished', label: 'Published', type: 'checkbox' },
  ]} hasImage />;
}

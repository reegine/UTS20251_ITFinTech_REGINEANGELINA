import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';
import Notification from '../../components/Notification';
import { useRouter } from 'next/router';

type User = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
};

export default function AdminUsers() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [notif, setNotif] = useState({ isVisible: false, type: 'info' as any, message: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/');
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Gagal fetch users');
      const json = await res.json();
      setUsers(json.data || []);
    } catch (error: any) {
      console.error(error);
      setNotif({ isVisible: true, type: 'error', message: error.message || 'Error' });
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, role })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create user');
      }
      const json = await res.json();
      setNotif({ isVisible: true, type: 'success', message: 'Admin berhasil dibuat' });
      setName(''); setEmail(''); setPhone(''); setPassword('');
      fetchUsers();
    } catch (error: any) {
      console.error(error);
      setNotif({ isVisible: true, type: 'error', message: error.message || 'Error create' });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive })
      });
      if (!res.ok) throw new Error('Failed to update user');
      setNotif({ isVisible: true, type: 'success', message: 'User updated' });
      fetchUsers();
    } catch (error: any) {
      setNotif({ isVisible: true, type: 'error', message: error.message || 'Update failed' });
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Hapus user ini? Tindakan tidak bisa dibatalkan.')) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Delete failed');
      setNotif({ isVisible: true, type: 'success', message: 'User dihapus' });
      fetchUsers();
    } catch (error: any) {
      setNotif({ isVisible: true, type: 'error', message: error.message || 'Delete failed' });
    }
  };

  if (!user || user.role !== 'admin') return <div>Access Denied</div>;

  return (
    <>
      <Head><title>Manage Users - Admin</title></Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Manage Users & Admins</h1>
            <p className="text-gray-600">Buat admin baru atau kelola akun yang sudah ada.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <form onSubmit={createAdmin} className="bg-white p-4 rounded shadow-sm border border-gray-200">
              <h3 className="font-semibold mb-3">Buat Admin Baru</h3>
              <input required value={name} onChange={(e)=>setName(e.target.value)} placeholder="Nama" className="w-full border rounded px-3 py-2 mb-2" />
              <input required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" type="email" className="w-full border rounded px-3 py-2 mb-2" />
              <input required value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" type="password" className="w-full border rounded px-3 py-2 mb-2" />
              <input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="Phone" className="w-full border rounded px-3 py-2 mb-2" />
              <select value={role} onChange={(e)=>setRole(e.target.value)} className="w-full border rounded px-3 py-2 mb-3">
                <option value="admin">Admin</option>
                <option value="user">User (normal)</option>
              </select>
              <button className="w-full bg-pink-600 text-white px-3 py-2 rounded">Create</button>
            </form>

            <div className="md:col-span-2 bg-white p-4 rounded shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <input placeholder="Search name or email" value={search} onChange={(e)=>setSearch(e.target.value)} className="border rounded px-3 py-2 w-1/2" />
                <button onClick={() => fetchUsers()} className="px-3 py-2 border rounded">Refresh</button>
              </div>

              {loading ? <div className="animate-spin h-8 w-8 border-4 border-pink-400 border-t-transparent rounded-full mx-auto" /> : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id} className="border-b">
                          <td className="px-3 py-2 text-sm">{u.name}</td>
                          <td className="px-3 py-2 text-sm">{u.email}</td>
                          <td className="px-3 py-2 text-sm">{u.role}</td>
                          <td className="px-3 py-2 text-sm">{u.isActive ? 'Active' : 'Disabled'}</td>
                          <td className="px-3 py-2 text-right text-sm">
                            <button onClick={() => toggleActive(u._id, !!u.isActive)} className="px-2 py-1 border rounded mr-2 text-sm">Toggle Active</button>
                            <button onClick={() => deleteUser(u._id)} className="px-2 py-1 border rounded text-sm">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Notification
        type={notif.type}
        message={notif.message}
        isVisible={notif.isVisible}
        onClose={() => setNotif(prev => ({ ...prev, isVisible: false }))}
        duration={4000}
      />
    </>
  );
}

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';
import Notification from '../../components/Notification';
import { useRouter } from 'next/router';
import { 
  ShieldCheck, 
  ShieldOff, 
  Trash2, 
  Power, 
  PowerOff, 
  ChevronDown, 
  ChevronRight,
  Users,
  UserCog,
  Filter,
  Search
} from 'lucide-react';

type User = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  mfaEnabled?: boolean;
  createdAt?: string;
};

type UserGroup = {
  role: string;
  users: User[];
  isExpanded: boolean;
};

export default function AdminUsers() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [notif, setNotif] = useState({ isVisible: false, type: 'info' as any, message: '' });
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [mfaFilter, setMfaFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  useEffect(() => {
    // Don't do anything while auth is loading
    if (authLoading) return;
    
    // Redirect if not admin
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    
    // Only fetch if we have a token
    if (token) {
      fetchUsers();
    }
  }, [user, token, search, authLoading, router]);

  useEffect(() => {
    organizeUsers();
  }, [users, activeFilter, mfaFilter]);

  const organizeUsers = () => {
    const filteredUsers = users.filter(user => {
      const activeMatch = activeFilter === 'all' || 
        (activeFilter === 'active' && user.isActive) ||
        (activeFilter === 'inactive' && !user.isActive);
      
      const mfaMatch = mfaFilter === 'all' ||
        (mfaFilter === 'enabled' && user.mfaEnabled) ||
        (mfaFilter === 'disabled' && !user.mfaEnabled);
      
      return activeMatch && mfaMatch;
    });

    const roles = ['admin', 'user'];
    const groups: UserGroup[] = roles.map(role => ({
      role,
      users: filteredUsers.filter(user => user.role === role),
      isExpanded: true
    }));

    setUserGroups(groups);
  };

  const fetchUsers = async () => {
    // CRITICAL FIX: Don't fetch if no token
    if (!token) {
      console.error('❌ No token available for fetching users');
      return;
    }

    try {
      setLoading(true);
      console.log('🔑 Fetching users with token:', token.substring(0, 20) + '...');
      
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      
      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal fetch users');
      }
      
      const json = await res.json();
      console.log('✅ Users fetched successfully:', json.data?.length || 0, 'users');
      setUsers(json.data || []);
    } catch (error: any) {
      console.error('❌ Fetch users error:', error);
      setNotif({ isVisible: true, type: 'error', message: error.message || 'Error' });
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async (e: any) => {
    e.preventDefault();
    
    if (!token) {
      setNotif({ isVisible: true, type: 'error', message: 'Not authenticated' });
      return;
    }
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ name, email, password, phone, role, mfaEnabled }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create user');
      }
      
      setNotif({ isVisible: true, type: 'success', message: 'Admin berhasil dibuat' });
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setMfaEnabled(false);
      fetchUsers();
    } catch (error: any) {
      console.error(error);
      setNotif({ isVisible: true, type: 'error', message: error.message || 'Error create' });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    if (!token) return;
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      
      if (!res.ok) throw new Error('Failed to update user');
      setNotif({ isVisible: true, type: 'success', message: 'User updated' });
      fetchUsers();
    } catch (error: any) {
      setNotif({ isVisible: true, type: 'error', message: error.message || 'Update failed' });
    }
  };

  const toggleMFA = async (id: string, currentMfaStatus: boolean) => {
    if (!token) return;
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ id, mfaEnabled: !currentMfaStatus }),
      });
      
      if (!res.ok) throw new Error('Failed to update MFA status');
      setNotif({
        isVisible: true,
        type: 'success',
        message: `MFA ${!currentMfaStatus ? 'enabled' : 'disabled'} successfully`,
      });
      fetchUsers();
    } catch (error: any) {
      setNotif({ isVisible: true, type: 'error', message: error.message || 'MFA update failed' });
    }
  };

  const deleteUser = async (id: string) => {
    if (!token) return;
    if (!confirm('Hapus user ini? Tindakan tidak bisa dibatalkan.')) return;
    
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error('Delete failed');
      setNotif({ isVisible: true, type: 'success', message: 'User dihapus' });
      fetchUsers();
    } catch (error: any) {
      setNotif({ isVisible: true, type: 'error', message: error.message || 'Delete failed' });
    }
  };

  const toggleGroup = (role: string) => {
    setUserGroups(groups => 
      groups.map(group => 
        group.role === role 
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    );
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? <UserCog className="h-5 w-5" /> : <Users className="h-5 w-5" />;
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-700 border-purple-200' 
      : 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-700' 
      : 'bg-red-100 text-red-700';
  };

  const getMfaColor = (mfaEnabled: boolean) => {
    return mfaEnabled 
      ? 'bg-green-100 text-green-700' 
      : 'bg-gray-100 text-gray-600';
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-pink-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show access denied if not admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Manage Users - Admin</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">User Management</h1>
            <p className="text-gray-500">Create new admins, manage existing users, and control MFA settings.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Create Admin Card */}
            <div className="lg:col-span-1">
              <form
                onSubmit={createAdmin}
                className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 sticky top-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Create New User
                </h3>
                <div className="space-y-3">
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                  <input
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                    className="w-full border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                  <input
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    type="password"
                    className="w-full border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone"
                    className="w-full border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={mfaEnabled}
                      onChange={(e) => setMfaEnabled(e.target.checked)}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Enable WhatsApp MFA</span>
                  </label>

                  <button
                    type="submit"
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 rounded-lg shadow-sm transition-all"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>

            {/* Users Tree View */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      placeholder="Search by name or email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={activeFilter}
                      onChange={(e) => setActiveFilter(e.target.value as any)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                    
                    <select
                      value={mfaFilter}
                      onChange={(e) => setMfaFilter(e.target.value as any)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="all">All MFA</option>
                      <option value="enabled">MFA Enabled</option>
                      <option value="disabled">MFA Disabled</option>
                    </select>
                    
                    <button
                      onClick={() => fetchUsers()}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Refresh
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin h-8 w-8 border-4 border-pink-400 border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userGroups.map((group) => (
                      <div key={group.role} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Group Header */}
                        <div 
                          className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition ${getRoleColor(group.role)}`}
                          onClick={() => toggleGroup(group.role)}
                        >
                          <div className="flex items-center gap-3">
                            {getRoleIcon(group.role)}
                            <div>
                              <h3 className="font-semibold capitalize">{group.role}s</h3>
                              <p className="text-sm opacity-75">{group.users.length} users</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm opacity-75">
                              {group.isExpanded ? 'Collapse' : 'Expand'}
                            </span>
                            {group.isExpanded ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </div>
                        </div>

                        {/* Group Content */}
                        {group.isExpanded && (
                          <div className="divide-y divide-gray-100">
                            {group.users.map((user) => (
                              <div key={user._id} className="p-4 hover:bg-gray-50 transition">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="font-medium text-gray-900">{user.name}</h4>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(!!user.isActive)}`}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMfaColor(!!user.mfaEnabled)}`}>
                                        {user.mfaEnabled ? 'MFA Enabled' : 'MFA Disabled'}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600">{user.email}</p>
                                    <p className="text-xs text-gray-500">{user.phone}</p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {/* Toggle Active */}
                                    <button
                                      onClick={() => toggleActive(user._id, !!user.isActive)}
                                      className={`p-2 rounded-lg border transition ${
                                        user.isActive
                                          ? 'bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100'
                                          : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                                      }`}
                                      title={user.isActive ? 'Disable user' : 'Enable user'}
                                    >
                                      {user.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                    </button>

                                    {/* Toggle MFA */}
                                    <button
                                      onClick={() => toggleMFA(user._id, !!user.mfaEnabled)}
                                      className={`p-2 rounded-lg border transition ${
                                        user.mfaEnabled
                                          ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
                                          : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                                      }`}
                                      title={user.mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
                                    >
                                      {user.mfaEnabled ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                                    </button>

                                    {/* Delete */}
                                    <button
                                      onClick={() => deleteUser(user._id)}
                                      className="p-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition"
                                      title="Delete user"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {group.users.length === 0 && (
                              <div className="p-4 text-center text-gray-500">
                                No {group.role}s found matching your filters
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {userGroups.every(group => group.users.length === 0) && (
                      <div className="text-center py-10 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No users found matching your criteria</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Notification
        type={notif.type}
        message={notif.message}
        isVisible={notif.isVisible}
        onClose={() => setNotif((prev) => ({ ...prev, isVisible: false }))}
        duration={4000}
      />
    </>
  );
}
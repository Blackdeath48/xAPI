'use client';

import { useEffect, useMemo, useState } from 'react';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'learner';
  createdAt: string;
}

const emptyUser: Partial<UserRecord> & { password?: string } = {
  id: '',
  email: '',
  name: '',
  role: 'learner',
  password: ''
};

export default function AdminUserManager() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selectedUser, setSelectedUser] = useState<typeof emptyUser>(emptyUser);
  const [status, setStatus] = useState<string | null>(null);
  const token = useMemo(() => (typeof window === 'undefined' ? '' : localStorage.getItem('token') || ''), []);

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleChange = (key: keyof typeof emptyUser, value: string) => {
    setSelectedUser((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => setSelectedUser(emptyUser);

  const saveUser = async () => {
    setStatus('Saving user...');
    const method = selectedUser.id ? 'PUT' : 'POST';
    const endpoint = selectedUser.id ? `/api/admin/users/${selectedUser.id}` : '/api/admin/users';
    const payload = { ...selectedUser };
    if (!selectedUser.password) {
      delete payload.password;
    }
    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setStatus('User saved.');
      resetForm();
      fetchUsers();
    } else {
      const data = await res.json().catch(() => ({ message: 'Failed to save user.' }));
      setStatus(data.message || 'Failed to save user.');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Remove this user?')) return;
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (res.ok) {
      setStatus('User deleted.');
      fetchUsers();
    } else {
      setStatus('Unable to delete user.');
    }
  };

  return (
    <section style={{ marginTop: '3rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem' }}>Learner Administration</h2>
          <p style={{ color: 'rgba(44,44,44,0.7)', marginTop: '0.25rem' }}>
            Invite employees, assign roles and monitor account health.
          </p>
        </div>
        <button className="btn-primary" onClick={resetForm}>
          Add new user
        </button>
      </header>

      {status && (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(255,128,64,0.1)' }}>
          {status}
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h3>{selectedUser.id ? 'Update user' : 'Create user'}</h3>
          <input
            className="input"
            placeholder="Full name"
            value={selectedUser.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
          <input
            className="input"
            placeholder="Email address"
            value={selectedUser.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
          <select
            className="input"
            value={selectedUser.role}
            onChange={(e) => handleChange('role', e.target.value)}
          >
            <option value="learner">Learner</option>
            <option value="admin">Admin</option>
          </select>
          <input
            className="input"
            type="password"
            placeholder={selectedUser.id ? 'Update password (optional)' : 'Set initial password'}
            value={selectedUser.password}
            onChange={(e) => handleChange('password', e.target.value)}
          />
          <button className="btn-primary" onClick={saveUser}>
            {selectedUser.id ? 'Save changes' : 'Create user'}
          </button>
        </div>

        <div className="card" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <h3>Directory</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className="badge" style={{ background: user.role === 'admin' ? 'rgba(0,70,255,0.15)' : 'rgba(255,128,64,0.15)' }}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-primary" onClick={() => setSelectedUser({ ...user, password: '' })}>
                      Edit
                    </button>
                    <button className="btn-secondary" onClick={() => deleteUser(user.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td colSpan={5}>Invite your first learner.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

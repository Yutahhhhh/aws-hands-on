import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import UserList from "@/components/features/users/UserList";
import UserForm from "@/components/features/users/UserForm";
import { User } from "@/types/user";
import "./App.css";

function App() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateUser = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  const handleFormSuccess = () => {
    // ユーザー一覧を再取得するためにkeyを更新
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">ダッシュボード</h2>
        </div>

        <UserList
          key={refreshKey}
          onCreateUser={handleCreateUser}
          onEditUser={handleEditUser}
        />

        <UserForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          user={editingUser}
        />
      </div>
    </Layout>
  );
}

export default App;

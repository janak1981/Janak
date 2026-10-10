"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminGuard, getAdminToken, logout } from "@/components/admin-guard";
import { PortfolioContent, PortfolioSettings, PortfolioPage } from "@/lib/content";
import { ChevronDown, LogOut, Plus, Save, X } from "lucide-react";

export default function AdminDashboard() {
  const [content, setContent] = useState<PortfolioContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "pages">("settings");
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Fetch current content
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const token = getAdminToken();
        const response = await fetch("/api/admin/content", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          router.push("/admin/login");
          return;
        }

        const data = await response.json();
        setContent(data.content);
      } catch (err) {
        setMessage("Failed to load content");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [router]);

  const handleSaveSettings = async () => {
    if (!content) return;

    setIsSaving(true);
    try {
      const token = getAdminToken();
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        setMessage("Settings saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to save settings");
      }
    } catch (err) {
      setMessage("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingChange = (key: keyof PortfolioSettings, value: string) => {
    if (!content) return;
    setContent({
      ...content,
      settings: { ...content.settings, [key]: value },
    });
  };

  const handlePageChange = (pageIndex: number, key: string, value: string) => {
    if (!content) return;
    const updatedPages = [...content.pages];
    updatedPages[pageIndex] = {
      ...updatedPages[pageIndex],
      [key]: value,
    };
    setContent({ ...content, pages: updatedPages });
  };

  const handleAddPage = () => {
    if (!content) return;
    const newPage: PortfolioPage = {
      id: `page-${Date.now()}`,
      slug: "",
      title: "New Page",
      navLabel: "New",
      eyebrow: "NEW",
      description: "Page description",
      kind: "cards",
      entries: [],
    };
    setContent({
      ...content,
      pages: [...content.pages, newPage],
    });
  };

  const handleDeletePage = (pageIndex: number) => {
    if (!content) return;
    setContent({
      ...content,
      pages: content.pages.filter((_, i) => i !== pageIndex),
    });
  };

  if (isLoading) {
    return (
      <AdminGuard>
        <div className="admin-loading">Loading dashboard...</div>
      </AdminGuard>
    );
  }

  if (!content) {
    return (
      <AdminGuard>
        <div className="admin-error">Failed to load content</div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="admin-dashboard">
        {/* Header */}
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <button onClick={logout} className="logout-btn">
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`admin-message ${message.includes("success") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`tab ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
          <button
            className={`tab ${activeTab === "pages" ? "active" : ""}`}
            onClick={() => setActiveTab("pages")}
          >
            Pages ({content.pages.length})
          </button>
        </div>

        {/* Content */}
        <div className="admin-content">
          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="settings-tab">
              <h2>Site Settings</h2>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={content.settings.name}
                  onChange={(e) => handleSettingChange("name", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Professional Role</label>
                <input
                  type="text"
                  value={content.settings.role}
                  onChange={(e) => handleSettingChange("role", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={content.settings.location}
                  onChange={(e) => handleSettingChange("location", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={content.settings.email}
                  onChange={(e) => handleSettingChange("email", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Introduction</label>
                <textarea
                  value={content.settings.introduction}
                  onChange={(e) => handleSettingChange("introduction", e.target.value)}
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>About</label>
                <textarea
                  value={content.settings.about}
                  onChange={(e) => handleSettingChange("about", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Current Availability</label>
                <input
                  type="text"
                  value={content.settings.availability}
                  onChange={(e) => handleSettingChange("availability", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Initials (for logo)</label>
                <input
                  type="text"
                  value={content.settings.initials}
                  onChange={(e) => handleSettingChange("initials", e.target.value)}
                  maxLength={2}
                />
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="save-btn"
              >
                <Save size={18} />
                {isSaving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          )}

          {/* Pages Tab */}
          {activeTab === "pages" && (
            <div className="pages-tab">
              <div className="pages-header">
                <h2>Portfolio Pages</h2>
                <button onClick={handleAddPage} className="add-page-btn">
                  <Plus size={18} />
                  Add Page
                </button>
              </div>

              <div className="pages-list">
                {content.pages.map((page, index) => (
                  <div key={page.id} className="page-card">
                    <div className="page-header">
                      <h3>{page.title}</h3>
                      <button
                        onClick={() => handleDeletePage(index)}
                        className="delete-btn"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="form-group">
                      <label>Page Title</label>
                      <input
                        type="text"
                        value={page.title}
                        onChange={(e) =>
                          handlePageChange(index, "title", e.target.value)
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>URL Slug (e.g., "research")</label>
                      <input
                        type="text"
                        value={page.slug}
                        onChange={(e) =>
                          handlePageChange(index, "slug", e.target.value)
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Navigation Label</label>
                      <input
                        type="text"
                        value={page.navLabel}
                        onChange={(e) =>
                          handlePageChange(index, "navLabel", e.target.value)
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Section Title (Eyebrow)</label>
                      <input
                        type="text"
                        value={page.eyebrow}
                        onChange={(e) =>
                          handlePageChange(index, "eyebrow", e.target.value)
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={page.description}
                        onChange={(e) =>
                          handlePageChange(index, "description", e.target.value)
                        }
                        rows={2}
                      />
                    </div>

                    <div className="form-group">
                      <label>Layout Type</label>
                      <select
                        value={page.kind}
                        onChange={(e) =>
                          handlePageChange(index, "kind", e.target.value)
                        }
                      >
                        <option value="timeline">Timeline</option>
                        <option value="cards">Cards</option>
                        <option value="prose">Prose</option>
                        <option value="links">Links</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="save-btn"
              >
                <Save size={18} />
                {isSaving ? "Saving..." : "Save All Changes"}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .admin-dashboard {
          min-height: 100vh;
          background: #f5f5f5;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .admin-header {
          background: white;
          padding: 20px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .admin-header h1 {
          margin: 0;
          font-size: 24px;
          color: #1a1a1a;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }

        .logout-btn:hover {
          background: #c0392b;
        }

        .admin-message {
          padding: 12px 30px;
          margin: 0;
          text-align: center;
          font-size: 14px;
          font-weight: 500;
        }

        .admin-message.success {
          background: #d4edda;
          color: #155724;
        }

        .admin-message.error {
          background: #f8d7da;
          color: #721c24;
        }

        .admin-tabs {
          display: flex;
          gap: 0;
          background: white;
          border-bottom: 1px solid #e0e0e0;
          padding: 0 30px;
        }

        .tab {
          padding: 16px 20px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #666;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #333;
        }

        .tab.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        .admin-content {
          padding: 30px;
          max-width: 800px;
          margin: 0 auto;
        }

        .settings-tab,
        .pages-tab {
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        h2 {
          margin: 0 0 24px 0;
          font-size: 18px;
          color: #1a1a1a;
        }

        .form-group {
          margin-bottom: 20px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        input,
        textarea,
        select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        input:focus,
        textarea:focus,
        select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .save-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          margin-top: 10px;
        }

        .save-btn:hover:not(:disabled) {
          background: #5568d3;
        }

        .save-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .pages-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .pages-header h2 {
          margin: 0;
        }

        .add-page-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #27ae60;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }

        .add-page-btn:hover {
          background: #229954;
        }

        .pages-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 20px;
        }

        .page-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          background: #fafafa;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .page-header h3 {
          margin: 0;
          font-size: 16px;
        }

        .delete-btn {
          padding: 6px 10px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .delete-btn:hover {
          background: #c0392b;
        }

        .admin-loading,
        .admin-error {
          padding: 60px 30px;
          text-align: center;
          font-size: 16px;
          color: #666;
        }

        .admin-error {
          color: #e74c3c;
        }
      `}</style>
    </AdminGuard>
  );
}

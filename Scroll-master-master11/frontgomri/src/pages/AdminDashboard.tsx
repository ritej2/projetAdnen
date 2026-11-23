import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  professionalToast as toast,
  confirmProfessionalAction,
  showProfessionalSuccessModal,
} from '../services/alertService';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Offre, Utilisateur } from '../types';
import { DashboardLayout } from '../layouts/MainLayouts';
import { KpiCard, StatusBadge } from '../components/SharedComponents';
import { useLanguage } from '../contexts/LanguageContext';

export const AdminDashboard: React.FC = () => {
  const { user, loading, refreshProfile } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [offres, setOffres] = useState<Offre[]>([]);
  const [mysqlTables, setMysqlTables] = useState<Record<string, any[]>>({});

  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [offerSearch, setOfferSearch] = useState('');

  // Edit Any User Modal (Admin)
  const [editingUser, setEditingUser] = useState<Utilisateur | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    role: 'CANDIDAT',
    actif: true,
  });

  // Admin Own Profile Form
  const [adminProfileForm, setAdminProfileForm] = useState({
    nom: user?.nom || 'Alexandre Moreau',
    email: user?.email || 'admin@talentflow.io',
    telephone: user?.telephone || '+33 1 42 68 55 00',
  });

  useEffect(() => {
    if (user) {
      setAdminProfileForm({
        nom: user.nom || '',
        email: user.email || '',
        telephone: user.telephone || '',
      });
    }
  }, [user]);

  const loadAdminData = async () => {
    try {
      const [statsRes, usersRes, offresRes, bdRes] = await Promise.all([
        api.get('/api/stats/admin'),
        api.get('/api/admin/users', {
          params: {
            search: userSearch || undefined,
            role: roleFilter || undefined,
            size: 50,
          },
        }),
        api.get('/api/admin/offres'),
        api.get('/api/bd'),
      ]);
      setStats(statsRes.data || {});
      setUsers(usersRes.data.content || []);
      setOffres(offresRes.data || []);
      setMysqlTables(bdRes.data || {});
    } catch {
      // handled gracefully
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/auth?mode=login&role=ADMIN', { replace: true });
      return;
    }
    if (user.role !== 'ADMIN') {
      navigate(user.role === 'ENTREPRISE' ? '/entreprise' : '/candidat', { replace: true });
      return;
    }
    loadAdminData();
  }, [loading, user?.id, user?.role, roleFilter]);

  const handleToggleUserStatus = async (u: Utilisateur) => {
    try {
      await api.patch(`/api/admin/users/${u.id}/status`, { actif: !u.actif });
      toast.success(
        `Compte de ${u.nom} ${!u.actif ? 'activé' : 'désactivé'} avec succès.`
      );
      await loadAdminData();
    } catch {
      toast.error('Impossible de modifier le statut de ce compte.');
    }
  };

  const handleModerateOfferStatus = async (offreId: number, statut: string) => {
    try {
      await api.patch(`/api/admin/offres/${offreId}/statut`, { statut });
      toast.success(`Statut de l’offre mis à jour (${statut}).`);
      await loadAdminData();
    } catch {
      toast.error('Erreur lors de la modération de l’offre.');
    }
  };

  const handleDeleteOffer = async (offreId: number) => {
    const confirmed = await confirmProfessionalAction(
      'Supprimer définitivement cette offre ?',
      'En tant qu’administrateur, cette action retirera immédiatement l’offre de la plateforme.',
      'Oui, supprimer',
      'Annuler'
    );
    if (!confirmed) return;
    try {
      await api.delete(`/api/admin/offres/${offreId}`);
      await showProfessionalSuccessModal(
        'Offre supprimée',
        'L’offre a été retirée de la plateforme avec succès.'
      );
      await loadAdminData();
    } catch (err) {
      toast.error(err, 'Modération impossible');
    }
  };

  const openEditUserModal = (u: Utilisateur) => {
    setEditingUser(u);
    setEditUserForm({
      nom: u.nom || '',
      email: u.email || '',
      telephone: u.telephone || '',
      role: u.role || 'CANDIDAT',
      actif: u.actif !== false,
    });
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.put(`/api/admin/users/${editingUser.id}`, editUserForm);
      setEditingUser(null);
      await loadAdminData();
      if (user && editingUser.id === user.id) {
        await refreshProfile();
      }
      await showProfessionalSuccessModal(
        'Profil utilisateur mis à jour',
        `Les informations de ${editUserForm.nom} (${editUserForm.role}) ont bien été enregistrées dans MySQL.`
      );
    } catch (err) {
      toast.error(err, 'Mise à jour impossible');
    }
  };

  const handleSaveAdminOwnProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/api/users/me', adminProfileForm);
      await refreshProfile();
      await loadAdminData();
      await showProfessionalSuccessModal(
        'Profil Administrateur mis à jour',
        'Vos informations administrateur ont été enregistrées avec succès.'
      );
    } catch (err) {
      toast.error(err, 'Mise à jour du profil');
    }
  };

  const tabs = [
    {
      id: 'overview',
      label: lang === 'ar' ? 'نظرة عامة وإحصائيات' : 'Vue globale & Statistiques',
      laIcon: 'la la-home',
    },
    {
      id: 'users',
      label: lang === 'ar' ? 'إدارة المستخدمين' : 'Gestion des utilisateurs',
      laIcon: 'la la-users',
      badge: users.length,
    },
    {
      id: 'moderation',
      label: lang === 'ar' ? 'مراجعة عروض العمل' : 'Modération des offres',
      laIcon: 'la la-shield-alt',
      badge: offres.length,
    },
  ];

  const roleChartData = [
    { name: lang === 'ar' ? 'المرشحون' : 'Candidats', value: stats.totalCandidats || 3 },
    { name: lang === 'ar' ? 'الشركات' : 'Entreprises', value: stats.totalEntreprises || 3 },
    { name: lang === 'ar' ? 'المسؤولون' : 'Administrateurs', value: 1 },
  ];
  const COLORS = ['#1967d2', '#34a853', '#f9ab00'];

  const filteredOffres = offres.filter((o) => {
    const q = offerSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      o.titre.toLowerCase().includes(q) ||
      o.nomEntreprise.toLowerCase().includes(q) ||
      o.localisation.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout
      title={lang === 'ar' ? 'لوحة الإدارة والرقابة' : 'Administration & Supervision'}
      subtitle={lang === 'ar' ? 'إدارة حسابات المستخدمين ومراقبة العروض ومتابعة المنصة' : 'Contrôle des comptes utilisateurs, modération des offres et supervision technique'}
      roleLabel={lang === 'ar' ? 'مسؤول' : 'ADMIN'}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'overview' && (
        <>
          <div className="row">
            <KpiCard
              label={lang === 'ar' ? 'إجمالي المستخدمين' : 'Total Utilisateurs'}
              value={stats.totalUsers || users.length}
              laIcon="la la-users"
              accent="blue"
            />
            <KpiCard
              label={lang === 'ar' ? 'الشركات المسجلة' : 'Entreprises inscrites'}
              value={stats.totalEntreprises || 3}
              laIcon="la la-building"
              accent="green"
            />
            <KpiCard
              label={lang === 'ar' ? 'عروض العمل' : 'Offres d’emploi'}
              value={stats.totalOffres || offres.length}
              laIcon="la la-briefcase"
              accent="yellow"
            />
            <KpiCard
              label={lang === 'ar' ? 'الترشيحات والمقابلات' : 'Candidatures & Entretiens'}
              value={stats.totalCandidatures || 4}
              laIcon="la la-file-invoice"
              accent="red"
            />
          </div>

          <div className="row">
            <div className="col-xl-6 col-lg-12">
              <div className="graph-widget ls-widget">
                <div className="widget-title">
                  <h4>Répartition des comptes par rôle</h4>
                </div>
                <div className="widget-content" style={{ height: '290px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {roleChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="col-xl-6 col-lg-12">
              <div className="notification-widget ls-widget">
                <div className="widget-title">
                  <h4>Derniers comptes inscrits sur la plateforme</h4>
                </div>
                <div className="widget-content">
                  <ul className="notification-list">
                    {users.slice(0, 5).map((u) => (
                      <li key={u.id}>
                        <span className="icon la la-user"></span>{' '}
                        <strong>{u.nom}</strong> ({u.email}) —{' '}
                        <span className="colored">{u.role}</span>{' '}
                        <span
                          style={{
                            marginLeft: '8px',
                            padding: '2px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            background: u.actif ? 'rgba(52, 168, 83, 0.15)' : 'rgba(217, 48, 37, 0.15)',
                            color: u.actif ? '#34a853' : '#d93025',
                          }}
                        >
                          {u.actif ? 'Actif' : 'Désactivé'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="row">
          <div className="col-lg-12">
            <div className="ls-widget">
              <div className="tabs-box">
                <div className="widget-title">
                  <h4>Annuaire et gestion des comptes utilisateurs ({users.length})</h4>
                  <div className="chosen-outer" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadAdminData()}
                      placeholder="Nom ou email..."
                      style={{
                        height: '42px',
                        padding: '0 15px',
                        background: '#f0f5f7',
                        borderRadius: '8px',
                        border: '1px solid #ecedf2',
                        fontSize: '14px',
                      }}
                    />
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="chosen-select"
                      style={{
                        height: '42px',
                        padding: '0 15px',
                        background: '#f0f5f7',
                        borderRadius: '8px',
                        border: '1px solid #ecedf2',
                      }}
                    >
                      <option value="">Tous les rôles</option>
                      <option value="CANDIDAT">CANDIDAT</option>
                      <option value="ENTREPRISE">ENTREPRISE</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    <button
                      onClick={loadAdminData}
                      className="theme-btn btn-style-one"
                      style={{ padding: '8px 18px', border: 'none', cursor: 'pointer' }}
                    >
                      Filtrer
                    </button>
                  </div>
                </div>

                <div className="widget-content">
                  <div className="table-outer">
                    <table className="default-table manage-job-table">
                      <thead>
                        <tr>
                          <th>Utilisateur</th>
                          <th>Rôle</th>
                          <th>Téléphone</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td>
                              <h6>{u.nom}</h6>
                              <span className="info">{u.email}</span>
                            </td>
                            <td>
                              <strong>{u.role}</strong>
                            </td>
                            <td>{u.telephone || 'Non renseigné'}</td>
                            <td>
                              <span className={u.actif ? 'status' : ''} style={{ color: u.actif ? '#34a853' : '#d93025', fontWeight: 600 }}>
                                {u.actif ? 'Actif' : 'Désactivé'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => openEditUserModal(u)}
                                  className="theme-btn btn-style-three"
                                  style={{ padding: '6px 12px', fontSize: '12px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                >
                                  ✏️ Modifier le profil
                                </button>
                                {u.role !== 'ADMIN' && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleUserStatus(u)}
                                    className={u.actif ? 'theme-btn btn-style-four' : 'theme-btn btn-style-one'}
                                    style={{ padding: '6px 12px', fontSize: '12px', border: 'none', cursor: 'pointer' }}
                                  >
                                    {u.actif ? 'Désactiver' : 'Réactiver'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'moderation' && (
        <div className="row">
          <div className="col-lg-12">
            <div className="ls-widget">
              <div className="tabs-box">
                <div className="widget-title">
                  <h4>Modération et supervision des offres d’emploi ({filteredOffres.length})</h4>
                  <div className="chosen-outer">
                    <input
                      type="text"
                      value={offerSearch}
                      onChange={(e) => setOfferSearch(e.target.value)}
                      placeholder="Rechercher une offre ou entreprise..."
                      style={{
                        height: '42px',
                        padding: '0 15px',
                        background: '#f0f5f7',
                        borderRadius: '8px',
                        border: '1px solid #ecedf2',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>
                <div className="widget-content">
                  <div className="table-outer">
                    <table className="default-table manage-job-table">
                      <thead>
                        <tr>
                          <th>Offre d’emploi</th>
                          <th>Entreprise</th>
                          <th>Candidatures</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOffres.map((o) => (
                          <tr key={o.id}>
                            <td>
                              <h6>
                                <Link to={`/offres/${o.id}`}>{o.titre}</Link>
                              </h6>
                              <span className="info">
                                <i className="icon la la-map-marker"></i> {o.localisation} · {o.typeContrat}
                              </span>
                            </td>
                            <td>{o.nomEntreprise}</td>
                            <td className="applied">{o.nombreCandidatures || 0} candidature(s)</td>
                            <td>
                              <StatusBadge status={o.statut} />
                            </td>
                            <td>
                              <div className="option-box">
                                <ul className="option-list">
                                  {o.statut === 'ACTIVE' ? (
                                    <li>
                                      <button
                                        onClick={() => handleModerateOfferStatus(o.id, 'SUSPENDUE')}
                                        data-text="Suspendre l'offre"
                                        title="Suspendre l'offre"
                                      >
                                        <span className="la la-ban"></span>
                                      </button>
                                    </li>
                                  ) : (
                                    <li>
                                      <button
                                        onClick={() => handleModerateOfferStatus(o.id, 'ACTIVE')}
                                        data-text="Activer l'offre"
                                        title="Activer l'offre"
                                      >
                                        <span className="la la-check"></span>
                                      </button>
                                    </li>
                                  )}
                                  <li>
                                    <button
                                      onClick={() => handleDeleteOffer(o.id)}
                                      data-text="Supprimer définitivement"
                                      title="Supprimer définitivement"
                                    >
                                      <span className="la la-trash"></span>
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Admin : Modifier le profil de n'importe quel utilisateur */}
      {editingUser && (
        <div className="superio-modal-backdrop" onClick={() => setEditingUser(null)}>
          <div
            className="superio-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '540px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
              }}
            >
              <h4 style={{ margin: 0, fontWeight: 700 }}>
                ✏️ Modifier l’utilisateur #{editingUser.id} ({editingUser.nom})
              </h4>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="default-form">
              <div className="form-group">
                <label>Nom complet *</label>
                <input
                  type="text"
                  required
                  value={editUserForm.nom}
                  onChange={(e) => setEditUserForm({ ...editUserForm, nom: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Adresse e-mail *</label>
                <input
                  type="email"
                  required
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="text"
                  value={editUserForm.telephone}
                  onChange={(e) => setEditUserForm({ ...editUserForm, telephone: e.target.value })}
                />
              </div>
              <div className="row">
                <div className="form-group col-md-6">
                  <label>Rôle du compte</label>
                  <select
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                  >
                    <option value="CANDIDAT">CANDIDAT</option>
                    <option value="ENTREPRISE">ENTREPRISE</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div className="form-group col-md-6">
                  <label>État du compte</label>
                  <select
                    value={editUserForm.actif ? 'true' : 'false'}
                    onChange={(e) =>
                      setEditUserForm({ ...editUserForm, actif: e.target.value === 'true' })
                    }
                  >
                    <option value="true">Actif</option>
                    <option value="false">Désactivé</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="theme-btn btn-style-three"
                >
                  Annuler
                </button>
                <button type="submit" className="theme-btn btn-style-one">
                  💾 Enregistrer dans MySQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

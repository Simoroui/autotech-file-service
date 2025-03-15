import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Modal, Alert, Spinner, Badge, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // États pour le modal d'édition d'utilisateur
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    credits: 0
  });
  const [updateMessage, setUpdateMessage] = useState(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Apply filters and sorting when users, searchTerm, roleFilter or sorting changes
  useEffect(() => {
    let filtered = [...users];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let fieldA = a[sortField];
      let fieldB = b[sortField];
      
      // Handle special fields
      if (sortField === 'createdAt') {
        fieldA = new Date(fieldA);
        fieldB = new Date(fieldB);
      }
      
      if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, sortField, sortDirection]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/users');
      setUsers(res.data);
      setFilteredUsers(res.data);
      setLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      credits: user.credits
    });
    setShowEditModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'credits' ? parseInt(value, 10) : value
    });
  };

  const updateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`/api/admin/users/${currentUser._id}`, formData);
      
      // Update local state with updated user
      setUsers(users.map(user => user._id === currentUser._id ? res.data : user));
      
      setUpdateMessage({
        type: 'success',
        text: 'Utilisateur mis à jour avec succès'
      });
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowEditModal(false);
        setUpdateMessage(null);
      }, 2000);
    } catch (err) {
      setUpdateMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Erreur lors de la mise à jour de l\'utilisateur'
      });
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="mt-3">{error}</Alert>
    );
  }

  return (
    <div className="container-fluid px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mt-4">Gestion des utilisateurs</h1>
        <Link to="/admin" className="btn btn-secondary">
          <i className="fas fa-arrow-left me-2"></i> Retour au tableau de bord
        </Link>
      </div>
      
      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Filtres et recherche</h5>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-md-4 mb-3">
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
            <div className="col-md-4 mb-3">
              <Form.Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">Tous les rôles</option>
                <option value="user">Utilisateurs</option>
                <option value="expert">Experts</option>
                <option value="admin">Administrateurs</option>
              </Form.Select>
            </div>
            <div className="col-md-4 mb-3 text-end">
              <span className="me-2">Total: {filteredUsers.length} utilisateurs</span>
            </div>
          </div>
        </Card.Body>
      </Card>
      
      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Liste des utilisateurs</h5>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table hover className="table-striped">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                    Nom {sortField === 'name' && <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>}
                  </th>
                  <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                    Email {sortField === 'email' && <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>}
                  </th>
                  <th onClick={() => handleSort('role')} style={{ cursor: 'pointer' }}>
                    Rôle {sortField === 'role' && <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>}
                  </th>
                  <th onClick={() => handleSort('credits')} style={{ cursor: 'pointer' }}>
                    Crédits {sortField === 'credits' && <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>}
                  </th>
                  <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
                    Inscription {sortField === 'createdAt' && <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <Badge bg={
                          user.role === 'admin' ? 'danger' : 
                          user.role === 'expert' ? 'warning' : 'primary'
                        }>
                          {user.role}
                        </Badge>
                      </td>
                      <td>{user.credits}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          onClick={() => handleEditUser(user)}
                          className="me-1"
                        >
                          <i className="fas fa-edit"></i> Modifier
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center">Aucun utilisateur trouvé</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
      
      {/* Modal d'édition d'utilisateur */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Modifier l'utilisateur</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {updateMessage && (
            <Alert variant={updateMessage.type}>
              {updateMessage.text}
            </Alert>
          )}
          <Form onSubmit={updateUser}>
            <Form.Group className="mb-3">
              <Form.Label>Nom</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Rôle</Form.Label>
              <Form.Select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                <option value="user">Utilisateur</option>
                <option value="expert">Expert</option>
                <option value="admin">Administrateur</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Crédits</Form.Label>
              <Form.Control
                type="number"
                name="credits"
                value={formData.credits}
                onChange={handleInputChange}
                required
                min="0"
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowEditModal(false)}>
                Annuler
              </Button>
              <Button variant="primary" type="submit">
                Enregistrer
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AdminUserManagement; 
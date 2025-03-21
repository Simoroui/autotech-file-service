import React, { useState, useContext, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Alert, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import AuthContext from '../context/auth/authContext';

const FileUpload = () => {
  const authContext = useContext(AuthContext);
  const { user, updateCredits } = authContext;
  const navigate = useNavigate();

  // États pour les listes déroulantes
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [engines, setEngines] = useState([]);
  const [transmissions, setTransmissions] = useState([]);
  
  // États pour les outils et méthodes de reprogrammation
  const [reprogrammingTools, setReprogrammingTools] = useState([
    'Autotuner Master',
    'Autotuner Slave',
    'CMD Master',
    'CMD Slave',
    'DimSport Master',
    'DimSport Slave',
    'KESS Master',
    'KESS Slave',
    'KTAG Master',
    'KTAG Slave',
    'MagPro Master',
    'MagPro Slave',
    'Magic Motorsport Master',
    'Magic Motorsport Slave',
    'PCMFlash Master',
    'PCMFlash Slave'
  ]);
  const [readMethods, setReadMethods] = useState([
    'OBD',
    'OBD VR',
    'Bench',
    'Bench VR',
    'Boot Mode'
  ]);

  const [formData, setFormData] = useState({
    vehicleType: '',
    manufacturer: '',
    model: '',
    year: '',
    engine: '',
    transmission: '',
    mileage: '',
    licensePlate: '',
    vin: '',
    reprogrammingTool: '',
    readMethod: '',
    ecuBrand: '',
    ecuType: '',
    hwNumber: '',
    swNumber: '',
    powerIncrease: '',
    dpfOff: false,
    opfOff: false,
    catalystOff: false,
    popAndBang: false,
    adBlueOff: false,
    egrOff: false,
    dtcRemoval: false,
    vmaxOff: false,
    startStopOff: false,
    comments: ''
  });

  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [totalCredits, setTotalCredits] = useState(50); // Default Stage 1

  // Charger les types de véhicules au chargement de la page
  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        const res = await axios.get('/api/vehicle-data/types');
        setVehicleTypes(res.data);
      } catch (err) {
        console.error('Erreur lors du chargement des types de véhicules:', err);
      }
    };

    fetchVehicleTypes();
  }, []);

  // Charger les constructeurs lorsque le type de véhicule change
  useEffect(() => {
    if (formData.vehicleType) {
      const fetchManufacturers = async () => {
        try {
          const res = await axios.get(`/api/vehicle-data/manufacturers?type=${formData.vehicleType}`);
          setManufacturers(res.data);
          // Réinitialiser les champs dépendants
          setFormData({
            ...formData,
            manufacturer: '',
            model: '',
            year: '',
            engine: '',
            transmission: ''
          });
          setModels([]);
          setYears([]);
          setEngines([]);
          setTransmissions([]);
        } catch (err) {
          console.error('Erreur lors du chargement des constructeurs:', err);
        }
      };

      fetchManufacturers();
    }
  }, [formData.vehicleType]);

  // Charger les modèles lorsque le constructeur change
  useEffect(() => {
    if (formData.manufacturer && formData.vehicleType) {
      const fetchModels = async () => {
        try {
          const res = await axios.get(`/api/vehicle-data/models/${encodeURIComponent(formData.manufacturer)}?type=${encodeURIComponent(formData.vehicleType)}`);
          setModels(res.data);
          // Réinitialiser les champs dépendants
          setFormData({
            ...formData,
            model: '',
            year: '',
            engine: '',
            transmission: ''
          });
          setYears([]);
          setEngines([]);
          setTransmissions([]);
        } catch (err) {
          console.error('Erreur lors du chargement des modèles:', err);
        }
      };

      fetchModels();
    }
  }, [formData.manufacturer, formData.vehicleType]);

  // Charger les années lorsque le modèle change
  useEffect(() => {
    if (formData.model && formData.manufacturer && formData.vehicleType) {
      const fetchYears = async () => {
        try {
          const res = await axios.get(`/api/vehicle-data/years/${encodeURIComponent(formData.manufacturer)}/${encodeURIComponent(formData.model)}?type=${encodeURIComponent(formData.vehicleType)}`);
          setYears(res.data);
          // Réinitialiser les champs dépendants
          setFormData({
            ...formData,
            year: '',
            engine: '',
            transmission: ''
          });
          setEngines([]);
          setTransmissions([]);
        } catch (err) {
          console.error('Erreur lors du chargement des années:', err);
        }
      };

      fetchYears();
    }
  }, [formData.model, formData.manufacturer, formData.vehicleType]);

  // Charger les moteurs lorsque l'année change
  useEffect(() => {
    if (formData.year && formData.model && formData.manufacturer && formData.vehicleType) {
      const fetchEngines = async () => {
        try {
          const res = await axios.get(`/api/vehicle-data/engines/${encodeURIComponent(formData.manufacturer)}/${encodeURIComponent(formData.model)}/${encodeURIComponent(formData.year)}?type=${encodeURIComponent(formData.vehicleType)}`);
          setEngines(res.data);
          // Réinitialiser les champs dépendants
          setFormData({
            ...formData,
            engine: '',
            transmission: ''
          });
          setTransmissions([]);
        } catch (err) {
          console.error('Erreur lors du chargement des moteurs:', err);
        }
      };

      fetchEngines();
    }
  }, [formData.year, formData.model, formData.manufacturer, formData.vehicleType]);

  // Charger les transmissions lorsque le moteur change
  useEffect(() => {
    if (formData.engine && formData.year && formData.model && formData.manufacturer && formData.vehicleType) {
      const fetchTransmissions = async () => {
        try {
          const res = await axios.get(`/api/vehicle-data/transmissions/${encodeURIComponent(formData.manufacturer)}/${encodeURIComponent(formData.model)}/${encodeURIComponent(formData.year)}/${encodeURIComponent(formData.engine)}?type=${encodeURIComponent(formData.vehicleType)}`);
          setTransmissions(res.data);
          // Réinitialiser le champ dépendant
          setFormData({
            ...formData,
            transmission: ''
          });
        } catch (err) {
          console.error('Erreur lors du chargement des transmissions:', err);
        }
      };

      fetchTransmissions();
    }
  }, [formData.engine, formData.year, formData.model, formData.manufacturer, formData.vehicleType]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept: {
      'application/octet-stream': ['.bin', '.hex']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    }
  });

  useEffect(() => {
    // Calculate total credits based on selected options
    let credits = 0;
    
    // Base cost for power increase
    if (formData.powerIncrease === 'Stage 1') credits += 50;
    else if (formData.powerIncrease === 'Stage 2') credits += 75;
    else if (formData.powerIncrease === 'Custom') credits += 100;
    // Si aucune augmentation de puissance n'est sélectionnée, le coût reste à 0
    
    // Additional options
    if (formData.dpfOff) credits += 25;
    if (formData.opfOff) credits += 25;
    if (formData.catalystOff && formData.popAndBang) credits += 40;
    else {
      if (formData.catalystOff) credits += 25;
      if (formData.popAndBang) credits += 25;
    }
    if (formData.adBlueOff) credits += 25;
    if (formData.egrOff) credits += 25;
    if (formData.dtcRemoval) credits += 15;
    if (formData.vmaxOff) credits += 25;
    if (formData.startStopOff) credits += 15;
    
    setTotalCredits(credits);
  }, [formData]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Ajouter un style pour l'étoile rouge
  const requiredFieldLabel = { color: 'red', marginLeft: '3px' };

  // Modifier la fonction onSubmit pour valider les champs obligatoires
  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Vérifier les champs obligatoires
    const requiredFields = [
      'vehicleType', 'manufacturer', 'model', 'year', 'engine', 'transmission',
      'reprogrammingTool', 'readMethod', 'ecuBrand', 'ecuType', 'hwNumber', 'swNumber'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setAlert({
        type: 'danger',
        message: `Veuillez remplir tous les champs obligatoires (marqués par une *)`
      });
      return;
    }
    
    // Vérifier qu'au moins une option est sélectionnée
    const hasSelectedOptions = 
      formData.powerIncrease || 
      formData.dpfOff || 
      formData.opfOff || 
      formData.catalystOff || 
      formData.popAndBang || 
      formData.adBlueOff || 
      formData.egrOff || 
      formData.dtcRemoval || 
      formData.vmaxOff || 
      formData.startStopOff;
    
    if (!hasSelectedOptions) {
      setAlert({
        type: 'danger',
        message: 'Veuillez sélectionner au moins une option de personnalisation'
      });
      return;
    }
    
    if (!file) {
      setAlert({
        type: 'danger',
        message: 'Veuillez sélectionner un fichier ECU'
      });
      return;
    }

    if (user.credits < totalCredits) {
      setAlert({
        type: 'danger',
        message: 'Crédits insuffisants. Veuillez acheter des crédits supplémentaires.'
      });
      return;
    }

    const data = new FormData();
    data.append('file', file);
    
    // Append all form data
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const res = await axios.post('/api/ecu-files', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      // Mettre à jour les crédits de l'utilisateur
      const newCredits = user.credits - totalCredits;
      updateCredits(newCredits);

      setAlert({
        type: 'success',
        message: 'Fichier envoyé avec succès'
      });

      // Redirect to file details page after 2 seconds
      setTimeout(() => {
        navigate(`/files/${res.data._id}`);
      }, 2000);
    } catch (err) {
      setIsUploading(false);
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Erreur lors de l\'envoi du fichier'
      });
    }
  };

  /* Ajout d'un style personnalisé pour les cartes sélectionnées */
  const cardStyle = {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    height: '100%'
  };

  const selectedCardStyle = {
    ...cardStyle,
    boxShadow: '0 0 0 3px #dc3545',
    transform: 'translateY(-3px)',
    backgroundColor: '#f8f9fa'
  };

  // Après les constantes et fonctions existantes, ajoutons une fonction pour déterminer l'étape active
  const determineActiveStep = (vehicle) => {
    const steps = [
      { field: 'vehicleType', step: 1 },
      { field: 'manufacturer', step: 2 },
      { field: 'model', step: 3 },
      { field: 'year', step: 4 },
      { field: 'engine', step: 5 },
      { field: 'transmission', step: 6 },
    ];
    
    let activeStep = 0;
    for (const {field, step} of steps) {
      if (vehicle[field]) activeStep = step;
      else break;
    }
    
    return activeStep;
  };

  return (
    <>
      <h1 className="mb-4">Envoyer un fichier ECU</h1>
      {alert.message && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert({ type: '', message: '' })}>
          {alert.message}
        </Alert>
      )}

      <Form onSubmit={onSubmit}>
        <div className="mb-3">
          <Alert variant="info">
            Les champs marqués d'une <span style={requiredFieldLabel}>*</span> sont obligatoires.
          </Alert>
        </div>
        <Row>
          <Col lg={8}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-dark text-white py-3">
                <h5 className="mb-0"><i className="fas fa-car me-2"></i>Informations sur le véhicule</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="mb-4">
                  <div className="progress-steps mb-4">
                    {['Type', 'Marque', 'Modèle', 'Année', 'Moteur', 'Transmission'].map((step, index) => {
                      const isActive = determineActiveStep(formData) >= index + 1;
                      return (
                        <div key={index} className={`progress-step ${isActive ? 'active' : ''}`}>
                          <div className="step-circle">{index + 1}</div>
                          <div className="step-text">{step}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Row className="g-3">
                  <Col md={6}>
                    <div className="form-floating mb-3">
                      <Form.Select
                        id="vehicleType"
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={onChange}
                        required
                        className="form-select"
                      >
                        <option value="">Sélectionner...</option>
                        {vehicleTypes.map((type, index) => (
                          <option key={index} value={type}>
                            {type}
                          </option>
                        ))}
                      </Form.Select>
                      <label htmlFor="vehicleType">
                        Type de véhicule<span style={requiredFieldLabel}>*</span>
                      </label>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="form-floating mb-3">
                      <Form.Select
                        id="manufacturer"
                        name="manufacturer"
                        value={formData.manufacturer}
                        onChange={onChange}
                        required
                        disabled={!formData.vehicleType}
                        className="form-select"
                      >
                        <option value="">Sélectionner...</option>
                        {manufacturers.map((manufacturer, index) => (
                          <option key={index} value={manufacturer}>
                            {manufacturer}
                          </option>
                        ))}
                      </Form.Select>
                      <label htmlFor="manufacturer">
                        Constructeur<span style={requiredFieldLabel}>*</span>
                      </label>
                    </div>
                  </Col>
                </Row>

                <Row className="g-3">
                  <Col md={6}>
                    <div className="form-floating mb-3">
                      <Form.Select
                        id="model"
                        name="model"
                        value={formData.model}
                        onChange={onChange}
                        required
                        disabled={!formData.manufacturer}
                        className="form-select"
                      >
                        <option value="">Sélectionner...</option>
                        {models.map((model, index) => (
                          <option key={index} value={model}>
                            {model}
                          </option>
                        ))}
                      </Form.Select>
                      <label htmlFor="model">
                        Modèle<span style={requiredFieldLabel}>*</span>
                      </label>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="form-floating mb-3">
                      <Form.Select
                        id="year"
                        name="year"
                        value={formData.year}
                        onChange={onChange}
                        required
                        disabled={!formData.model}
                        className="form-select"
                      >
                        <option value="">Sélectionner...</option>
                        {years.map((year, index) => (
                          <option key={index} value={year}>
                            {year}
                          </option>
                        ))}
                      </Form.Select>
                      <label htmlFor="year">
                        Année<span style={requiredFieldLabel}>*</span>
                      </label>
                    </div>
                  </Col>
                </Row>

                <Row className="g-3">
                  <Col md={6}>
                    <div className="form-floating mb-3">
                      <Form.Select
                        id="engine"
                        name="engine"
                        value={formData.engine}
                        onChange={onChange}
                        required
                        disabled={!formData.year}
                        className="form-select"
                      >
                        <option value="">Sélectionner...</option>
                        {engines.map((engine, index) => (
                          <option key={index} value={engine}>
                            {engine}
                          </option>
                        ))}
                      </Form.Select>
                      <label htmlFor="engine">
                        Moteur<span style={requiredFieldLabel}>*</span>
                      </label>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="form-floating mb-3">
                      <Form.Select
                        id="transmission"
                        name="transmission"
                        value={formData.transmission}
                        onChange={onChange}
                        required
                        disabled={!formData.engine}
                        className="form-select"
                      >
                        <option value="">Sélectionner...</option>
                        {transmissions.map((transmission, index) => (
                          <option key={index} value={transmission}>
                            {transmission}
                          </option>
                        ))}
                      </Form.Select>
                      <label htmlFor="transmission">
                        Boîte de vitesse<span style={requiredFieldLabel}>*</span>
                      </label>
                    </div>
                  </Col>
                </Row>

                <div className="card bg-light p-3 mb-4 mt-2">
                  <h6 className="mb-3">Informations supplémentaires (facultatives)</h6>
                  <Row className="g-3">
                    <Col md={4}>
                      <div className="form-floating">
                        <Form.Control
                          id="mileage"
                          type="number"
                          name="mileage"
                          value={formData.mileage}
                          onChange={onChange}
                          placeholder="Ex: 50000"
                        />
                        <label htmlFor="mileage">Kilométrage</label>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="form-floating">
                        <Form.Control
                          id="licensePlate"
                          type="text"
                          name="licensePlate"
                          value={formData.licensePlate}
                          onChange={onChange}
                          placeholder="Ex: AB-123-CD"
                        />
                        <label htmlFor="licensePlate">Plaque d'immatriculation</label>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="form-floating">
                        <Form.Control
                          id="vin"
                          type="text"
                          name="vin"
                          value={formData.vin}
                          onChange={onChange}
                          placeholder="Ex: WVWZZZ1KZAW123456"
                        />
                        <label htmlFor="vin">VIN</label>
                      </div>
                    </Col>
                  </Row>
                </div>

                {formData.manufacturer && formData.model && formData.year && formData.engine && (
                  <div className="vehicle-preview p-3 border rounded bg-light">
                    <h6 className="mb-3"><i className="fas fa-check-circle text-success me-2"></i>Véhicule sélectionné</h6>
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        <i className="fas fa-car fa-3x text-secondary"></i>
                      </div>
                      <div>
                        <h5 className="mb-1">{formData.manufacturer} {formData.model} ({formData.year})</h5>
                        <p className="mb-0 text-muted">{formData.engine} | {formData.transmission}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-dark text-white py-3">
                <h5 className="mb-0"><i className="fas fa-microchip me-2"></i>Informations sur le fichier</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <Row className="g-4 mb-4">
                  <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <h6 className="fw-bold mb-3">
                          <i className="fas fa-tools me-2 text-primary"></i>
                          Outil de reprogrammation
                          <span style={requiredFieldLabel}>*</span>
                        </h6>
                        <div className="form-floating mb-3">
                          <select 
                            className={`form-select ${formData.reprogrammingTool ? 'is-valid' : ''}`}
                            name="reprogrammingTool"
                            id="reprogrammingTool"
                            value={formData.reprogrammingTool}
                            onChange={onChange}
                            required
                          >
                            <option value="">Sélectionner...</option>
                            {reprogrammingTools.map((tool, index) => (
                              <option key={index} value={tool}>
                                {tool}
                              </option>
                            ))}
                          </select>
                          <label htmlFor="reprogrammingTool">Outil de reprogrammation</label>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <h6 className="fw-bold mb-3">
                          <i className="fas fa-download me-2 text-success"></i>
                          Méthode de lecture
                          <span style={requiredFieldLabel}>*</span>
                        </h6>
                        <div className="form-floating mb-3">
                          <select 
                            className={`form-select ${formData.readMethod ? 'is-valid' : ''}`}
                            name="readMethod"
                            id="readMethod"
                            value={formData.readMethod}
                            onChange={onChange}
                            required
                          >
                            <option value="">Sélectionner...</option>
                            {readMethods.map((method, index) => (
                              <option key={index} value={method}>
                                {method}
                              </option>
                            ))}
                          </select>
                          <label htmlFor="readMethod">Méthode de lecture</label>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row className="g-4 mb-4">
                  <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <h6 className="fw-bold mb-3">
                          <i className="fas fa-microchip me-2 text-info"></i>
                          Informations ECU
                          <span style={requiredFieldLabel}>*</span>
                        </h6>
                        <div className="mb-3">
                          <div className="form-floating mb-3">
                            <Form.Control
                              id="ecuBrand"
                              type="text"
                              name="ecuBrand"
                              value={formData.ecuBrand}
                              onChange={onChange}
                              required
                              placeholder="Ex: Bosch, Continental, Delphi..."
                              className={formData.ecuBrand ? 'is-valid' : ''}
                            />
                            <label htmlFor="ecuBrand">Marque ECU</label>
                          </div>

                          <div className="form-floating">
                            <Form.Control
                              id="ecuType"
                              type="text"
                              name="ecuType"
                              value={formData.ecuType}
                              onChange={onChange}
                              required
                              placeholder="Ex: EDC17C46, MED17.5..."
                              className={formData.ecuType ? 'is-valid' : ''}
                            />
                            <label htmlFor="ecuType">Type de ECU</label>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <h6 className="fw-bold mb-3">
                          <i className="fas fa-code me-2 text-warning"></i>
                          Numéros de référence
                          <span style={requiredFieldLabel}>*</span>
                        </h6>
                        <div className="mb-3">
                          <div className="form-floating mb-3">
                            <Form.Control
                              id="hwNumber"
                              type="text"
                              name="hwNumber"
                              value={formData.hwNumber}
                              onChange={onChange}
                              required
                              placeholder="Ex: 0281020088"
                              className={formData.hwNumber ? 'is-valid' : ''}
                            />
                            <label htmlFor="hwNumber">N°HW</label>
                          </div>

                          <div className="form-floating">
                            <Form.Control
                              id="swNumber"
                              type="text"
                              name="swNumber"
                              value={formData.swNumber}
                              onChange={onChange}
                              required
                              placeholder="Ex: 1037535248"
                              className={formData.swNumber ? 'is-valid' : ''}
                            />
                            <label htmlFor="swNumber">N°SW</label>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <h6 className="fw-bold mb-3">
                      <i className="fas fa-file-upload me-2 text-danger"></i>
                      Fichier original
                      <span style={requiredFieldLabel}>*</span>
                    </h6>
                    <div
                      {...getRootProps()}
                      className={`dropzone p-5 text-center border rounded ${
                        isDragActive ? 'border-primary bg-light' : file ? 'border-success bg-light' : 'border-dashed'
                      }`}
                      style={{ borderStyle: file ? 'solid' : 'dashed', transition: 'all 0.3s ease' }}
                    >
                      <input {...getInputProps()} />
                      {file ? (
                        <div className="p-3">
                          <div className="mb-3">
                            <i className="fas fa-file-code text-success fa-3x"></i>
                          </div>
                          <h5 className="mb-2">{file.name}</h5>
                          <p className="mb-0 text-muted">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <div className="mt-3">
                            <span className="badge bg-success py-2 px-3">
                              <i className="fas fa-check me-1"></i> Fichier prêt
                            </span>
                          </div>
                        </div>
                      ) : isDragActive ? (
                        <div className="p-4">
                          <div className="mb-3">
                            <i className="fas fa-cloud-download-alt text-primary fa-3x"></i>
                          </div>
                          <h5>Déposez le fichier ici...</h5>
                        </div>
                      ) : (
                        <div className="p-4">
                          <div className="mb-3">
                            <i className="fas fa-upload fa-3x text-muted"></i>
                          </div>
                          <h5 className="mb-2">Glissez-déposez votre fichier ici</h5>
                          <p className="mb-3 text-muted">ou cliquez pour sélectionner</p>
                          <Button variant="outline-primary" className="px-4">
                            <i className="fas fa-folder-open me-2"></i>
                            Parcourir les fichiers
                          </Button>
                          <p className="mt-3 text-muted small">
                            Formats acceptés: .bin, .hex (max 100 MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-dark text-white py-3">
                <h5 className="mb-0"><i className="fas fa-sliders-h me-2"></i>Options de personnalisation</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold fs-5 mb-3">
                    Augmentation de la puissance
                  </Form.Label>
                  <Row className="g-3">
                    <Col sm={6} md={3}>
                      <Card 
                        style={formData.powerIncrease === '' ? selectedCardStyle : cardStyle}
                        role="button"
                        onClick={() => setFormData({...formData, powerIncrease: ''})}
                      >
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center p-3">
                          <div className="mb-2">
                            <i className="fas fa-ban fa-2x text-muted"></i>
                          </div>
                          <h6 className="mb-2">Aucune</h6>
                          <div className="badge bg-secondary mt-auto">0 crédit</div>
                          <Form.Check
                            className="visually-hidden"
                            type="radio"
                            name="powerIncrease"
                            value=""
                            checked={formData.powerIncrease === ''}
                            onChange={onChange}
                            id="none"
                          />
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col sm={6} md={3}>
                      <Card 
                        style={formData.powerIncrease === 'Stage 1' ? selectedCardStyle : cardStyle}
                        role="button"
                        onClick={() => setFormData({...formData, powerIncrease: 'Stage 1'})}
                      >
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center p-3">
                          <div className="mb-2">
                            <i className="fas fa-tachometer-alt fa-2x text-warning"></i>
                          </div>
                          <h6 className="mb-2">Stage 1</h6>
                          <div className="badge bg-danger mt-auto">50 crédits</div>
                          <Form.Check
                            className="visually-hidden"
                            type="radio"
                            name="powerIncrease"
                            value="Stage 1"
                            checked={formData.powerIncrease === 'Stage 1'}
                            onChange={onChange}
                            id="stage1"
                          />
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col sm={6} md={3}>
                      <Card 
                        style={formData.powerIncrease === 'Stage 2' ? selectedCardStyle : cardStyle}
                        role="button"
                        onClick={() => setFormData({...formData, powerIncrease: 'Stage 2'})}
                      >
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center p-3">
                          <div className="mb-2">
                            <i className="fas fa-tachometer-alt fa-2x text-orange"></i>
                          </div>
                          <h6 className="mb-2">Stage 2</h6>
                          <div className="badge bg-danger mt-auto">75 crédits</div>
                          <Form.Check
                            className="visually-hidden"
                            type="radio"
                            name="powerIncrease"
                            value="Stage 2"
                            checked={formData.powerIncrease === 'Stage 2'}
                            onChange={onChange}
                            id="stage2"
                          />
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col sm={6} md={3}>
                      <Card 
                        style={formData.powerIncrease === 'Custom' ? selectedCardStyle : cardStyle}
                        role="button"
                        onClick={() => setFormData({...formData, powerIncrease: 'Custom'})}
                      >
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center p-3">
                          <div className="mb-2">
                            <i className="fas fa-cogs fa-2x text-danger"></i>
                          </div>
                          <h6 className="mb-2">Sur mesure</h6>
                          <div className="badge bg-danger mt-auto">100 crédits</div>
                          <Form.Check
                            className="visually-hidden"
                            type="radio"
                            name="powerIncrease"
                            value="Custom"
                            checked={formData.powerIncrease === 'Custom'}
                            onChange={onChange}
                            id="custom"
                          />
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Form.Group>

                <hr className="my-4" />
                
                <Form.Label className="fw-bold fs-5 mb-3">Options supplémentaires</Form.Label>
                <Row className="g-3">
                  <Col md={6} xl={3}>
                    <Card 
                      style={formData.dpfOff ? selectedCardStyle : cardStyle}
                      role="button"
                      onClick={() => setFormData({...formData, dpfOff: !formData.dpfOff})}
                    >
                      <Card.Body className="d-flex flex-column text-center p-3">
                        <div className="mb-2">
                          <i className="fas fa-filter fa-2x mb-3 text-muted"></i>
                        </div>
                        <h6 className="mb-2">Arrêt DPF/FAP</h6>
                        <p className="small text-muted mb-3">Désactive le filtre à particules diesel</p>
                        <div className="badge bg-danger mt-auto">+25 crédits</div>
                        <Form.Check
                          className="visually-hidden"
                          type="checkbox"
                          name="dpfOff"
                          checked={formData.dpfOff}
                          onChange={onChange}
                        />
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} xl={3}>
                    <Card 
                      style={formData.opfOff ? selectedCardStyle : cardStyle}
                      role="button"
                      onClick={() => setFormData({...formData, opfOff: !formData.opfOff})}
                    >
                      <Card.Body className="d-flex flex-column text-center p-3">
                        <div className="mb-2">
                          <i className="fas fa-smog fa-2x mb-3 text-muted"></i>
                        </div>
                        <h6 className="mb-2">Arrêt OPF/GPF</h6>
                        <p className="small text-muted mb-3">Désactive le filtre à particules essence</p>
                        <div className="badge bg-danger mt-auto">+25 crédits</div>
                        <Form.Check
                          className="visually-hidden"
                          type="checkbox"
                          name="opfOff"
                          checked={formData.opfOff}
                          onChange={onChange}
                        />
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} xl={3}>
                    <Card 
                      style={formData.catalystOff ? selectedCardStyle : cardStyle}
                      role="button"
                      onClick={() => setFormData({...formData, catalystOff: !formData.catalystOff})}
                    >
                      <Card.Body className="d-flex flex-column text-center p-3">
                        <div className="mb-2">
                          <i className="fas fa-wind fa-2x mb-3 text-muted"></i>
                        </div>
                        <h6 className="mb-2">Arrêt catalyseur</h6>
                        <p className="small text-muted mb-3">Désactive les sondes lambda</p>
                        <div className="badge bg-danger mt-auto">+25 crédits</div>
                        <Form.Check
                          className="visually-hidden"
                          type="checkbox"
                          name="catalystOff"
                          checked={formData.catalystOff}
                          onChange={onChange}
                        />
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} xl={3}>
                    <Card 
                      style={formData.popAndBang ? selectedCardStyle : cardStyle}
                      role="button"
                      onClick={() => setFormData({...formData, popAndBang: !formData.popAndBang})}
                    >
                      <Card.Body className="d-flex flex-column text-center p-3">
                        <div className="mb-2">
                          <i className="fas fa-fire fa-2x mb-3 text-muted"></i>
                        </div>
                        <h6 className="mb-2">Activation Pop&Bang</h6>
                        <p className="small text-muted mb-3">Crépitements à la décélération</p>
                        <div className="badge bg-danger mt-auto">+25 crédits</div>
                        <Form.Check
                          className="visually-hidden"
                          type="checkbox"
                          name="popAndBang"
                          checked={formData.popAndBang}
                          onChange={onChange}
                        />
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} xl={3}>
                    <Card 
                      style={formData.adBlueOff ? selectedCardStyle : cardStyle}
                      role="button"
                      onClick={() => setFormData({...formData, adBlueOff: !formData.adBlueOff})}
                    >
                      <Card.Body className="d-flex flex-column text-center p-3">
                        <div className="mb-2">
                          <i className="fas fa-tint fa-2x mb-3 text-muted"></i>
                        </div>
                        <h6 className="mb-2">Arrêt AdBlue</h6>
                        <p className="small text-muted mb-3">Supprime le système AdBlue</p>
                        <div className="badge bg-danger mt-auto">+25 crédits</div>
                        <Form.Check
                          className="visually-hidden"
                          type="checkbox"
                          name="adBlueOff"
                          checked={formData.adBlueOff}
                          onChange={onChange}
                        />
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} xl={3}>
                    <Card 
                      style={formData.egrOff ? selectedCardStyle : cardStyle}
                      role="button"
                      onClick={() => setFormData({...formData, egrOff: !formData.egrOff})}
                    >
                      <Card.Body className="d-flex flex-column text-center p-3">
                        <div className="mb-2">
                          <i className="fas fa-recycle fa-2x mb-3 text-muted"></i>
                        </div>
                        <h6 className="mb-2">Blocage/retrait EGR</h6>
                        <p className="small text-muted mb-3">Désactive la vanne EGR</p>
                        <div className="badge bg-danger mt-auto">+25 crédits</div>
                        <Form.Check
                          className="visually-hidden"
                          type="checkbox"
                          name="egrOff"
                          checked={formData.egrOff}
                          onChange={onChange}
                        />
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} xl={3}>
                    <Card 
                      style={formData.dtcRemoval ? selectedCardStyle : cardStyle}
                      role="button"
                      onClick={() => setFormData({...formData, dtcRemoval: !formData.dtcRemoval})}
                    >
                      <Card.Body className="d-flex flex-column text-center p-3">
                        <div className="mb-2">
                          <i className="fas fa-times-circle fa-2x mb-3 text-muted"></i>
                        </div>
                        <h6 className="mb-2">Retrait code DTC</h6>
                        <p className="small text-muted mb-3">Supprime les codes défaut</p>
                        <div className="badge bg-danger mt-auto">+15 crédits</div>
                        <Form.Check
                          className="visually-hidden"
                          type="checkbox"
                          name="dtcRemoval"
                          checked={formData.dtcRemoval}
                          onChange={onChange}
                        />
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} xl={3}>
                    <Card 
                      style={formData.vmaxOff ? selectedCardStyle : cardStyle}
                      role="button"
                      onClick={() => setFormData({...formData, vmaxOff: !formData.vmaxOff})}
                    >
                      <Card.Body className="d-flex flex-column text-center p-3">
                        <div className="mb-2">
                          <i className="fas fa-tachometer-alt fa-2x mb-3 text-muted"></i>
                        </div>
                        <h6 className="mb-2">Vmax Off</h6>
                        <p className="small text-muted mb-3">Supprime le limiteur de vitesse</p>
                        <div className="badge bg-danger mt-auto">+25 crédits</div>
                        <Form.Check
                          className="visually-hidden"
                          type="checkbox"
                          name="vmaxOff"
                          checked={formData.vmaxOff}
                          onChange={onChange}
                        />
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} xl={3}>
                    <Card 
                      style={formData.startStopOff ? selectedCardStyle : cardStyle}
                      role="button"
                      onClick={() => setFormData({...formData, startStopOff: !formData.startStopOff})}
                    >
                      <Card.Body className="d-flex flex-column text-center p-3">
                        <div className="mb-2">
                          <i className="fas fa-power-off fa-2x mb-3 text-muted"></i>
                        </div>
                        <h6 className="mb-2">Start/Stop Off</h6>
                        <p className="small text-muted mb-3">Désactive le système Start/Stop</p>
                        <div className="badge bg-danger mt-auto">+15 crédits</div>
                        <Form.Check
                          className="visually-hidden"
                          type="checkbox"
                          name="startStopOff"
                          checked={formData.startStopOff}
                          onChange={onChange}
                        />
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <hr className="my-4" />

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Commentaires</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="comments"
                    value={formData.comments}
                    onChange={onChange}
                    placeholder="Ajoutez des instructions ou des informations supplémentaires..."
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <div className="sticky-top" style={{ top: '20px' }}>
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-light text-dark">
                  <h5 className="mb-0">Résumé</h5>
                </Card.Header>
                <Card.Body>
                  <p>
                    <strong>Total des crédits :</strong>{' '}
                    <span className="badge bg-danger">{totalCredits}</span>
                  </p>
                  <p>
                    <strong>Vos crédits disponibles :</strong>{' '}
                    <span className="badge bg-success">{user?.credits || 0}</span>
                  </p>
                  {user?.credits < totalCredits && (
                    <Alert variant="warning">
                      Crédits insuffisants. Veuillez acheter des crédits supplémentaires.
                    </Alert>
                  )}

                  {isUploading && (
                    <div className="mb-3">
                      <p className="mb-1">Envoi en cours...</p>
                      <ProgressBar
                        animated
                        now={uploadProgress}
                        label={`${uploadProgress}%`}
                        variant="danger"
                      />
                    </div>
                  )}

                  <div className="d-grid gap-2">
                    <Button
                      variant="danger"
                      size="lg"
                      type="submit"
                      disabled={isUploading || user?.credits < totalCredits}
                    >
                      {isUploading ? 'Envoi en cours...' : 'Envoyer le fichier'}
                    </Button>
                    <Button variant="outline-secondary" type="reset">
                      Réinitialiser
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              <Card className="shadow-sm">
                <Card.Header className="bg-light text-dark">
                  <h5 className="mb-0">Besoin d'aide ?</h5>
                </Card.Header>
                <Card.Body>
                  <p>
                    Si vous avez des questions ou besoin d'assistance, n'hésitez pas à nous
                    contacter.
                  </p>
                  <div className="d-grid">
                    <Button variant="outline-danger">
                      <i className="fas fa-headset me-2"></i> Contacter le support
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Form>
    </>
  );
};

export default FileUpload; 
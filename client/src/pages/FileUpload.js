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
  const [reprogrammingTools, setReprogrammingTools] = useState(['Autotuner', 'KESS', 'CMD Flash', 'Alientech', 'Magic Motorsport']);
  const [readMethods, setReadMethods] = useState(['OBD', 'Boot Mode', 'BDM', 'Bench', 'Tricore']);

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
              <Card.Header className="bg-dark text-white">
                <h5 className="mb-0">Informations sur le véhicule</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Type de véhicule
                        <span style={requiredFieldLabel}>*</span>
                      </Form.Label>
                      <Form.Select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={onChange}
                        required
                      >
                        <option value="">Sélectionner...</option>
                        {vehicleTypes.map((type, index) => (
                          <option key={index} value={type}>
                            {type}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Constructeur
                        <span style={requiredFieldLabel}>*</span>
                      </Form.Label>
                      <Form.Select
                        name="manufacturer"
                        value={formData.manufacturer}
                        onChange={onChange}
                        required
                        disabled={!formData.vehicleType}
                      >
                        <option value="">Sélectionner...</option>
                        {manufacturers.map((manufacturer, index) => (
                          <option key={index} value={manufacturer}>
                            {manufacturer}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Modèle
                        <span style={requiredFieldLabel}>*</span>
                      </Form.Label>
                      <Form.Select
                        name="model"
                        value={formData.model}
                        onChange={onChange}
                        required
                        disabled={!formData.manufacturer}
                      >
                        <option value="">Sélectionner...</option>
                        {models.map((model, index) => (
                          <option key={index} value={model}>
                            {model}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Année
                        <span style={requiredFieldLabel}>*</span>
                      </Form.Label>
                      <Form.Select
                        name="year"
                        value={formData.year}
                        onChange={onChange}
                        required
                        disabled={!formData.model}
                      >
                        <option value="">Sélectionner...</option>
                        {years.map((year, index) => (
                          <option key={index} value={year}>
                            {year}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Moteur
                        <span style={requiredFieldLabel}>*</span>
                      </Form.Label>
                      <Form.Select
                        name="engine"
                        value={formData.engine}
                        onChange={onChange}
                        required
                        disabled={!formData.year}
                      >
                        <option value="">Sélectionner...</option>
                        {engines.map((engine, index) => (
                          <option key={index} value={engine}>
                            {engine}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Boîte de vitesse
                        <span style={requiredFieldLabel}>*</span>
                      </Form.Label>
                      <Form.Select
                        name="transmission"
                        value={formData.transmission}
                        onChange={onChange}
                        required
                        disabled={!formData.engine}
                      >
                        <option value="">Sélectionner...</option>
                        {transmissions.map((transmission, index) => (
                          <option key={index} value={transmission}>
                            {transmission}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Kilométrage</Form.Label>
                      <Form.Control
                        type="number"
                        name="mileage"
                        value={formData.mileage}
                        onChange={onChange}
                        placeholder="Ex: 50000"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Plaque d'immatriculation</Form.Label>
                      <Form.Control
                        type="text"
                        name="licensePlate"
                        value={formData.licensePlate}
                        onChange={onChange}
                        placeholder="Ex: AB-123-CD"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>VIN</Form.Label>
                      <Form.Control
                        type="text"
                        name="vin"
                        value={formData.vin}
                        onChange={onChange}
                        placeholder="Ex: WVWZZZ1KZAW123456"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-dark text-white">
                <h5 className="mb-0">Informations sur le fichier</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Outil de reprogrammation
                        <span style={requiredFieldLabel}>*</span>
                      </Form.Label>
                      <Form.Select
                        name="reprogrammingTool"
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
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Méthode de lecture
                        <span style={requiredFieldLabel}>*</span>
                      </Form.Label>
                      <Form.Select
                        name="readMethod"
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
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Marque ECU
                        <span style={requiredFieldLabel}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="ecuBrand"
                        value={formData.ecuBrand}
                        onChange={onChange}
                        required
                        placeholder="Ex: Bosch, Continental, Delphi..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Type de ECU
                        <span style={requiredFieldLabel}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="ecuType"
                        value={formData.ecuType}
                        onChange={onChange}
                        required
                        placeholder="Ex: EDC17C46, MED17.5..."
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        N°HW
                        <span style={requiredFieldLabel}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="hwNumber"
                        value={formData.hwNumber}
                        onChange={onChange}
                        required
                        placeholder="Ex: 0281020088"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        N°SW
                        <span style={requiredFieldLabel}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="swNumber"
                        value={formData.swNumber}
                        onChange={onChange}
                        required
                        placeholder="Ex: 1037535248"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Fichier original
                    <span style={requiredFieldLabel}>*</span>
                  </Form.Label>
                  <div
                    {...getRootProps()}
                    className={`dropzone p-4 text-center border rounded ${
                      isDragActive ? 'border-primary bg-light' : ''
                    }`}
                  >
                    <input {...getInputProps()} />
                    {file ? (
                      <div>
                        <p className="mb-0">
                          <i className="fas fa-file-code text-success me-2"></i>
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      </div>
                    ) : isDragActive ? (
                      <p className="mb-0">Déposez le fichier ici...</p>
                    ) : (
                      <div>
                        <i className="fas fa-upload fa-2x mb-2 text-muted"></i>
                        <p className="mb-0">
                          Glissez-déposez votre fichier ici, ou cliquez pour sélectionner
                        </p>
                        <p className="text-muted small">
                          Formats acceptés: .bin, .hex (max 100 MB)
                        </p>
                      </div>
                    )}
                  </div>
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-dark text-white">
                <h5 className="mb-0">Options de personnalisation</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-4">
                  <Form.Label>
                    Augmentation de la puissance
                  </Form.Label>
                  <div>
                    <Form.Check
                      inline
                      type="radio"
                      label="Aucune (0 crédit)"
                      name="powerIncrease"
                      value=""
                      checked={formData.powerIncrease === ''}
                      onChange={onChange}
                      id="none"
                    />
                    <Form.Check
                      inline
                      type="radio"
                      label="Stage 1 (50 crédits)"
                      name="powerIncrease"
                      value="Stage 1"
                      checked={formData.powerIncrease === 'Stage 1'}
                      onChange={onChange}
                      id="stage1"
                    />
                    <Form.Check
                      inline
                      type="radio"
                      label="Stage 2 (75 crédits)"
                      name="powerIncrease"
                      value="Stage 2"
                      checked={formData.powerIncrease === 'Stage 2'}
                      onChange={onChange}
                      id="stage2"
                    />
                    <Form.Check
                      inline
                      type="radio"
                      label="Sur mesure (100 crédits)"
                      name="powerIncrease"
                      value="Custom"
                      checked={formData.powerIncrease === 'Custom'}
                      onChange={onChange}
                      id="custom"
                    />
                  </div>
                </Form.Group>

                <Form.Label>Options supplémentaires</Form.Label>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Arrêt DPF/FAP (+25 crédits)"
                        name="dpfOff"
                        checked={formData.dpfOff}
                        onChange={onChange}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Arrêt OPF/GPF (+25 crédits)"
                        name="opfOff"
                        checked={formData.opfOff}
                        onChange={onChange}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Arrêt catalyseur (lambda off) (+25 crédits)"
                        name="catalystOff"
                        checked={formData.catalystOff}
                        onChange={onChange}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Activation Pop&Bang (+25 crédits)"
                        name="popAndBang"
                        checked={formData.popAndBang}
                        onChange={onChange}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Arrêt AdBlue (+25 crédits)"
                        name="adBlueOff"
                        checked={formData.adBlueOff}
                        onChange={onChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Blocage/retrait EGR (+25 crédits)"
                        name="egrOff"
                        checked={formData.egrOff}
                        onChange={onChange}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Retrait code DTC / P (+15 crédits)"
                        name="dtcRemoval"
                        checked={formData.dtcRemoval}
                        onChange={onChange}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Vmax (suppression du limiteur de vitesse) (+25 crédits)"
                        name="vmaxOff"
                        checked={formData.vmaxOff}
                        onChange={onChange}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Start/Stop system off (+15 crédits)"
                        name="startStopOff"
                        checked={formData.startStopOff}
                        onChange={onChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Commentaires</Form.Label>
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
                <Card.Header className="bg-dark text-white">
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
                <Card.Header className="bg-dark text-white">
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
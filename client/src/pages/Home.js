import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  // État pour les menus déroulants du simulateur
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('');
  
  // État pour les options disponibles dans chaque menu
  const [brands, setBrands] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  const [engineOptions, setEngineOptions] = useState([]);
  
  // État pour stocker les données de gains de performance
  const [selectedVehicleData, setSelectedVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulationResult, setSimulationResult] = useState(null);
  const [error, setError] = useState('');

  // Charger les marques au chargement de la page
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/vehicle-data/manufacturers?type=Voiture');
        setBrands(res.data);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des marques:', error);
        setLoading(false);
      }
    };
    
    fetchBrands();
  }, []);

  // Charger les modèles quand la marque change
  useEffect(() => {
    if (selectedBrand) {
      const fetchModels = async () => {
        try {
          const res = await axios.get(`/api/vehicle-data/models/${encodeURIComponent(selectedBrand)}?type=Voiture`);
          setModelOptions(res.data);
          setSelectedModel('');
          setSelectedYear('');
          setSelectedEngine('');
          setYearOptions([]);
          setEngineOptions([]);
        } catch (error) {
          console.error('Erreur lors du chargement des modèles:', error);
        }
      };
      
      fetchModels();
    } else {
      setModelOptions([]);
    }
  }, [selectedBrand]);

  // Charger les années quand le modèle change
  useEffect(() => {
    if (selectedBrand && selectedModel) {
      const fetchYears = async () => {
        try {
          const res = await axios.get(`/api/vehicle-data/years/${encodeURIComponent(selectedBrand)}/${encodeURIComponent(selectedModel)}?type=Voiture`);
          setYearOptions(res.data);
          setSelectedYear('');
          setSelectedEngine('');
          setEngineOptions([]);
        } catch (error) {
          console.error('Erreur lors du chargement des années:', error);
        }
      };
      
      fetchYears();
    } else {
      setYearOptions([]);
    }
  }, [selectedBrand, selectedModel]);

  // Charger les motorisations quand l'année change
  useEffect(() => {
    if (selectedBrand && selectedModel && selectedYear) {
      const fetchEngines = async () => {
        try {
          const res = await axios.get(`/api/vehicle-data/engines/${encodeURIComponent(selectedBrand)}/${encodeURIComponent(selectedModel)}/${encodeURIComponent(selectedYear)}?type=Voiture`);
          setEngineOptions(res.data);
          setSelectedEngine('');
        } catch (error) {
          console.error('Erreur lors du chargement des motorisations:', error);
        }
      };
      
      fetchEngines();
    } else {
      setEngineOptions([]);
    }
  }, [selectedBrand, selectedModel, selectedYear]);

  // Ajout des gestionnaires d'événements pour les sélections
  const handleBrandChange = (e) => {
    setSelectedBrand(e.target.value);
    // Réinitialiser les sélections suivantes
    setSelectedModel('');
    setSelectedYear('');
    setSelectedEngine('');
    setSimulationResult(null);
  };

  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
    // Réinitialiser les sélections suivantes
    setSelectedYear('');
    setSelectedEngine('');
    setSimulationResult(null);
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    // Réinitialiser les sélections suivantes
    setSelectedEngine('');
    setSimulationResult(null);
  };

  const handleEngineChange = (e) => {
    setSelectedEngine(e.target.value);
    setSimulationResult(null);
  };

  // Fonction pour simuler les gains
  const simulateGains = async () => {
    console.log('Simulation démarrée avec:', { selectedBrand, selectedModel, selectedYear, selectedEngine });
    
    if (!selectedBrand || !selectedModel || !selectedYear || !selectedEngine) {
      setError('Veuillez sélectionner toutes les options du véhicule');
      return;
    }
    
    setLoading(true);
    setError('');
    setSimulationResult(null);
    
    try {
      // Construire l'URL avec les paramètres
      const url = `/api/vehicle-data/performance-gains?brand=${encodeURIComponent(selectedBrand)}&model=${encodeURIComponent(selectedModel)}&year=${encodeURIComponent(selectedYear)}&engine=${encodeURIComponent(selectedEngine)}`;
      
      console.log('Appel API avec URL:', url);
      
      const response = await axios.get(url);
      
      console.log('Réponse API:', response.data);
      
      if (!response.data) {
        throw new Error('Données non disponibles pour ce véhicule');
      }
      
      // Mise à jour de l'état avec les données reçues
      setSelectedVehicleData(response.data);
      setSimulationResult(response.data);
      console.log('Simulation réussie:', response.data);
      
    } catch (err) {
      console.error('Erreur pendant la simulation:', err);
      setError(err.response?.data?.error || err.message || 'Erreur lors de la récupération des données');
      setSelectedVehicleData(null);
      setSimulationResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Navigation ajoutée en haut de la page */}
      <div className="top-navigation" style={{ 
        background: '#000', 
        borderBottom: '1px solid rgba(230,0,0,0.3)', 
        position: 'sticky', 
        top: 0, 
        zIndex: 1000 
      }}>
        <Container>
          <div className="d-flex justify-content-end py-2">
            <a href="/" className="text-light me-4 text-decoration-none">
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>ACCUEIL</span>
            </a>
            <a href="#simulateur" className="text-light me-4 text-decoration-none">
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>SIMULATEUR</span>
            </a>
            <a href="/login" className="text-light text-decoration-none">
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>TARIFICATION</span>
            </a>
          </div>
        </Container>
      </div>

      {/* Section Hero avec design technologique noir et rouge - version plus dynamique */}
      <div className="hero-section text-light py-0" style={{ 
        background: 'linear-gradient(135deg, #000000 0%, #330000 100%)',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: 'none'
      }}>
        {/* Élément de fond dynamique */}
        <div className="position-absolute w-100 h-100" style={{
          background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'400\' viewBox=\'0 0 800 800\'%3E%3Cg fill=\'none\' stroke=\'%23e60000\' stroke-width=\'1\'%3E%3Cpath d=\'M769 229L1037 260.9M927 880L731 737 520 660 309 538 40 599 295 764 126.5 879.5 40 599-197 493 102 382-31 229 126.5 79.5-69-63\'/%3E%3Cpath d=\'M-31 229L237 261 390 382 603 493 308.5 537.5 101.5 381.5M370 905L295 764\'/%3E%3Cpath d=\'M520 660L578 842 731 737 840 599 603 493 520 660 295 764 309 538 390 382 539 269 769 229 577.5 41.5 370 105 295 -36 126.5 79.5 237 261 102 382 40 599 -69 737 127 880\'/%3E%3Cpath d=\'M520-140L578.5 42.5 731-63M603 493L539 269 237 261 370 105M902 382L539 269M390 382L102 382\'/%3E%3Cpath d=\'M-222 42L126.5 79.5 370 105 539 269 577.5 41.5 927 80 769 229 902 382 603 493 731 737M295-36L577.5 41.5M578 842L295 764M40-201L127 80M102 382L-261 269\'/%3E%3C/g%3E%3Cg fill=\'%23e60000\' opacity=\'0.05\'%3E%3Ccircle cx=\'769\' cy=\'229\' r=\'5\'/%3E%3Ccircle cx=\'539\' cy=\'269\' r=\'5\'/%3E%3Ccircle cx=\'603\' cy=\'493\' r=\'5\'/%3E%3Ccircle cx=\'731\' cy=\'737\' r=\'5\'/%3E%3Ccircle cx=\'520\' cy=\'660\' r=\'5\'/%3E%3Ccircle cx=\'309\' cy=\'538\' r=\'5\'/%3E%3Ccircle cx=\'295\' cy=\'764\' r=\'5\'/%3E%3Ccircle cx=\'40\' cy=\'599\' r=\'5\'/%3E%3Ccircle cx=\'102\' cy=\'382\' r=\'5\'/%3E%3Ccircle cx=\'127\' cy=\'80\' r=\'5\'/%3E%3Ccircle cx=\'370\' cy=\'105\' r=\'5\'/%3E%3Ccircle cx=\'578\' cy=\'42\' r=\'5\'/%3E%3Ccircle cx=\'237\' cy=\'261\' r=\'5\'/%3E%3Ccircle cx=\'390\' cy=\'382\' r=\'5\'/%3E%3C/g%3E%3C/svg%3E")',
          backgroundSize: 'cover',
          opacity: 0.2,
          animation: 'rotateBg 120s linear infinite'
        }}></div>

        {/* Particules animées */}
        <div className="position-absolute w-100 h-100" style={{ zIndex: 1, overflow: 'hidden' }}>
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle position-absolute rounded-circle" style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              background: i % 3 === 0 ? '#e60000' : '#ffffff',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.1
            }}></div>
          ))}
        </div>

        {/* Lignes dynamiques */}
        <div className="position-absolute" style={{
          width: '80%',
          height: '2px',
          left: '10%',
          top: '20%',
          background: 'linear-gradient(90deg, transparent, rgba(230,0,0,0.5), transparent)',
          transform: 'skewY(-5deg)',
          zIndex: 1
        }}></div>
        
        <div className="position-absolute" style={{
          width: '60%',
          height: '1px',
          right: '0',
          top: '60%',
          background: 'linear-gradient(90deg, transparent, rgba(230,0,0,0.3), transparent)',
          transform: 'skewY(8deg)',
          zIndex: 1
        }}></div>

        <Container className="py-5 position-relative" style={{ zIndex: 2 }}>
          <Row className="align-items-center">
            <Col lg={6} className="mb-5 mb-lg-0 position-relative">
              <div className="position-relative slide-in-left">
                <div className="mb-3 d-flex align-items-center">
                  <div style={{
                    background: '#e60000',
                    width: '40px',
                    height: '3px',
                    marginRight: '15px'
                  }}></div>
                  <span className="text-uppercase text-danger fw-bold" style={{letterSpacing: '3px'}}>Performance Tuning</span>
                </div>
                <h1 className="display-4 fw-bold mb-3 text-white" style={{
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  textShadow: '0 0 20px rgba(230,0,0,0.3)'
                }}>
                  AUTO<span className="text-danger">TECH</span> FILE <span className="text-danger">SERVICE</span>
              </h1>
                <div className="typing-container mb-4">
                  <span className="typing-text">Optimisation moteur professionnelle</span>
                </div>
                <p className="lead mb-4 text-light fade-in-up" style={{maxWidth: '500px'}}>
                  Notre <span className="text-danger fw-bold">plateforme professionnelle</span> permet à votre garage d'accéder à des 
                  <span className="border-bottom border-danger"> solutions de reprogrammation</span> ECU sécurisées pour 
                  <span className="border-bottom border-danger"> optimiser</span> les performances des véhicules de vos clients ou adapter une option de repogrammation.
                </p>
                <div className="d-grid gap-2 d-md-flex justify-content-md-start mt-4 fade-in-up" style={{animationDelay: '0.4s'}}>
                <Link to="/register">
                    <Button 
                      variant="danger" 
                      size="lg" 
                      className="px-4 py-3 me-md-3 pulse-button" 
                      style={{
                        borderRadius: '0',
                        boxShadow: '0 0 20px rgba(230,0,0,0.4)',
                        border: 'none',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <span className="position-relative z-index-1">COMMENCER MAINTENANT</span>
                      <div className="position-absolute" style={{
                        top: 0,
                        left: '-100%',
                        width: '200%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                        animation: 'shine 2s infinite',
                      }}></div>
                  </Button>
                </Link>
                <Link to="/login">
                    <Button 
                      variant="outline-light" 
                      size="lg" 
                      className="px-4 py-3 border-2 hover-effect"
                      style={{
                        borderRadius: '0',
                        background: 'transparent',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      SE CONNECTER
                  </Button>
                </Link>
                </div>
              </div>
            </Col>
            <Col lg={6} className="position-relative">
              <div className="position-relative slide-in-right">
                <div className="glowing-border position-absolute w-100 h-100" style={{
                  border: '1px solid rgba(230,0,0,0.3)',
                  transform: 'translate(15px, 15px)',
                  zIndex: 1
                }}></div>
                <div className="corner-design position-absolute" style={{
                  width: '100px',
                  height: '100px',
                  borderTop: '2px solid #e60000',
                  borderRight: '2px solid #e60000',
                  right: '-20px',
                  top: '-20px',
                  zIndex: 1
                }}></div>
                <div className="corner-design position-absolute" style={{
                  width: '70px',
                  height: '70px',
                  borderBottom: '2px solid #e60000',
                  borderLeft: '2px solid #e60000',
                  left: '-10px',
                  bottom: '60px',
                  zIndex: 1
                }}></div>
                <img
                  src="/hero.jpg"
                  alt="Voiture haute performance"
                  className="img-fluid w-100 position-relative zoom-effect"
                  style={{ 
                    boxShadow: '0 0 30px rgba(230,0,0,0.3)',
                    zIndex: 2,
                    filter: 'contrast(1.1) brightness(0.9)',
                    maxHeight: '400px',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    transition: 'all 1s ease'
                  }}
                />
              </div>
            </Col>
          </Row>
        </Container>

        {/* Animations */}
        <style jsx="true">{`
          @keyframes pulse {
            0% { opacity: 0.4; }
            100% { opacity: 0.8; }
          }
          @keyframes shine {
            0% { left: -100%; }
            100% { left: 100%; }
          }
          @keyframes rotateBg {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes float {
            0% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0); }
          }
          @keyframes typing {
            from { width: 0 }
            to { width: 100% }
          }
          @keyframes blink {
            50% { border-color: transparent }
          }
          .z-index-1 {
            position: relative;
            z-index: 1;
          }
          .particle {
            animation: float 8s infinite ease-in-out;
          }
          .typing-container {
            display: inline-block;
            position: relative;
          }
          .typing-text {
            color: rgba(255,255,255,0.8);
            font-size: 1.2rem;
            letter-spacing: 1px;
            overflow: hidden;
            border-right: 2px solid #e60000;
            white-space: nowrap;
            animation: 
              typing 3.5s steps(40, end),
              blink .75s step-end infinite;
          }
          .pulse-button {
            animation: pulse-animation 2s infinite;
          }
          @keyframes pulse-animation {
            0% { box-shadow: 0 0 0 0 rgba(230, 0, 0, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(230, 0, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(230, 0, 0, 0); }
          }
          .hover-effect:hover {
            background: rgba(230, 0, 0, 0.1) !important;
            transform: translateY(-2px);
          }
          .fade-in-up {
            opacity: 0;
            transform: translateY(20px);
            animation: fadeInUp 0.8s forwards;
          }
          @keyframes fadeInUp {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .slide-in-left {
            opacity: 0;
            transform: translateX(-30px);
            animation: slideInLeft 0.8s forwards;
          }
          @keyframes slideInLeft {
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .slide-in-right {
            opacity: 0;
            transform: translateX(30px);
            animation: slideInRight 0.8s forwards;
          }
          @keyframes slideInRight {
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .zoom-effect:hover {
            transform: scale(1.02);
          }
          .price-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at top right, rgba(230,0,0,0.1), transparent 60%);
            pointer-events: none;
            z-index: 0;
          }
          .transition-width {
            transition: width 1.5s ease-in-out;
          }
          .simulator-card {
            box-shadow: 0 15px 35px rgba(0,0,0,0.5);
          }
          .simulator-card:hover {
            box-shadow: 0 20px 40px rgba(230,0,0,0.15);
          }
        `}</style>
      </div>

      {/* Section Services avec un design plus dynamique */}
      <div className="services-section position-relative py-5" style={{ 
        background: 'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Élément de fond dynamique */}
        <div className="position-absolute w-100 h-100" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23e60000\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.2
        }}></div>

        <Container className="position-relative" style={{ zIndex: 2 }}>
          <div className="text-center mb-5 slide-up">
            <h5 className="text-danger fw-bold mb-2" style={{letterSpacing: '3px'}}>NOS SERVICES</h5>
            <h2 className="display-6 fw-bold text-white mb-4">Solutions de reprogrammation pro</h2>
            <div className="mx-auto" style={{width: '50px', height: '3px', background: '#e60000'}}></div>
      </div>

          {/* Stages de reprogrammation avec design plus dynamique */}
          <h3 className="fw-bold mb-4 text-white slide-up">Nos formules</h3>
          <Row className="g-4 mb-5">
            {[
              {
                title: "Stage 1",
                credits: 50,
                icon: "fa-tachometer-alt",
                description: "Optimisation standard adaptée à la plupart des véhicules pour améliorer les performances tout en préservant la fiabilité."
              },
              {
                title: "Stage 2",
                credits: 75,
                icon: "fa-bolt",
                description: "Reprogrammation avancée pour une amélioration significative des performances, idéale pour les véhicules équipés de modifications."
              },
              {
                title: "Sur mesure",
                credits: 100,
                icon: "fa-cogs",
                description: "Solution personnalisée selon vos besoins spécifiques, optimisée pour une performance maximale adaptée à votre véhicule."
              }
            ].map((stage, index) => (
              <Col md={4} key={index} className="slide-up" style={{ animationDelay: `${0.1 * (index + 1)}s` }}>
                <Card className="h-100 glass-card" style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '0',
                  border: 'none',
                  backdropFilter: 'blur(5px)',
                  transition: 'all 0.4s ease',
                  transform: 'translateY(0)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                  overflow: 'hidden'
                }}>
                  <div className="position-absolute" style={{
                    width: '150px',
                    height: '150px',
                    background: 'radial-gradient(circle, rgba(230,0,0,0.3) 0%, transparent 70%)',
                    top: '-50px',
                    right: '-50px',
                    borderRadius: '50%'
                  }}></div>
                  <Card.Body className="p-4 position-relative">
                    <div className="d-flex align-items-center mb-3">
                      <div className="p-3 me-3 text-center" style={{
                        width: '60px', 
                        height: '60px',
                        background: 'rgba(230,0,0,0.2)',
                        border: '1px solid rgba(230,0,0,0.3)'
                      }}>
                        <i className={`fas ${stage.icon} fa-2x text-danger`}></i>
                      </div>
                      <div>
                        <Card.Title className="mb-0 fw-bold fs-3 text-white">{stage.title}</Card.Title>
                        <span className="fs-4 fw-bold text-danger">{stage.credits} crédits</span>
                      </div>
                </div>
                    <Card.Text className="text-light">
                      {stage.description}
                </Card.Text>
                    <div className="mt-3 text-end">
                      <a href="#simulateur" className="text-decoration-none">
                        <span className="text-danger fw-bold">
                          VOIR DÉTAILS <i className="fas fa-long-arrow-alt-right ms-1"></i>
                        </span>
                      </a>
                    </div>
                    <div className="position-absolute" style={{
                      width: '30px',
                      height: '30px',
                      borderBottom: '2px solid rgba(230,0,0,0.3)',
                      borderLeft: '2px solid rgba(230,0,0,0.3)',
                      left: '15px',
                      bottom: '15px'
                    }}></div>
              </Card.Body>
            </Card>
          </Col>
            ))}
          </Row>

          {/* Options supplémentaires avec design plus dynamique */}
          <Row className="mt-5">
            <h5 className="fw-bold mb-3 text-white slide-up">Options supplémentaires</h5>
            {[
              { name: 'Arrêt DPF/FAP', description: 'Désactive le filtre à particules diesel', icon: 'filter', credits: 25 },
              { name: 'Arrêt OPF/GPF', description: 'Désactive le filtre à particules essence', icon: 'filter', credits: 25 },
              { name: 'Arrêt catalyseur', description: 'Désactive les sondes lambda', icon: 'wind', credits: 25 },
              { name: 'Activation Pop&Bang', description: 'Crépitements à la décélération', icon: 'volume-up', credits: 25 },
              { name: 'Arrêt AdBlue', description: 'Supprime le système AdBlue', icon: 'flask', credits: 25 },
              { name: 'Blocage/retrait EGR', description: 'Désactive la vanne EGR', icon: 'sliders-h', credits: 25 },
              { name: 'Retrait code DTC', description: 'Supprime les codes défaut', icon: 'exclamation-triangle', credits: 15 },
              { name: 'Vmax Off', description: 'Supprime le limiteur de vitesse', icon: 'tachometer-alt', credits: 25 },
              { name: 'Start/Stop Off', description: 'Désactive le système Start/Stop', icon: 'power-off', credits: 15 },
            ].map((option, index) => (
              <Col md={6} lg={4} key={index} className="mb-4 slide-up" style={{ animationDelay: `${0.1 * (index + 1)}s` }}>
                <Card className="h-100 option-card" style={{
                  background: 'rgba(22,22,22,0.5)',
                  borderRadius: '0',
                  borderLeft: '3px solid #e60000',
                  transition: 'all 0.3s ease'
                }}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center mb-3">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center me-3" 
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          backgroundColor: 'rgba(230,0,0,0.1)', 
                          color: '#e60000'
                        }}
                      >
                        <i className={`fas fa-${option.icon}`}></i>
                      </div>
                      <div>
                        <h5 className="fw-bold mb-0 text-white">{option.name}</h5>
                        <span className="text-danger fw-bold">+{option.credits} crédits</span>
                      </div>
                </div>
                    <p className="text-white opacity-75">{option.description}</p>
              </Card.Body>
            </Card>
          </Col>
            ))}
          </Row>
        </Container>

        <style jsx="true">{`
          .slide-up {
            opacity: 0;
            transform: translateY(30px);
            animation: slideUp 0.8s forwards;
          }
          @keyframes slideUp {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .fade-in {
            opacity: 0;
            animation: fadeIn 0.8s forwards;
          }
          @keyframes fadeIn {
            to {
              opacity: 1;
            }
          }
          .glass-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 15px 40px rgba(230,0,0,0.15);
          }
          .option-card:hover {
            background: rgba(255,255,255,0.07);
            transform: translateX(5px);
          }
          .price-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 15px 30px rgba(230,0,0,0.15);
          }
          .price-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at top right, rgba(230,0,0,0.1), transparent 60%);
            pointer-events: none;
            z-index: 0;
          }
        `}</style>
      </div>

      {/* Section Simulateur de puissance avec design technologique rouge/blanc/noir */}
      <div className="simulator-section position-relative py-5" style={{ 
        background: 'linear-gradient(to bottom, #ffffff, #f7f7f7 70%, #f0f0f0 100%)',
        color: 'black',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Circuit imprimé dynamique en arrière-plan */}
        <div className="position-absolute w-100 h-100" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' stroke=\'%23e60000\' stroke-width=\'0.25\'%3E%3Cpath d=\'M0,0 L100,0 L100,100 L0,100 Z\'/%3E%3Cpath d=\'M0,25 L100,25\'/%3E%3Cpath d=\'M0,50 L100,50\'/%3E%3Cpath d=\'M0,75 L100,75\'/%3E%3Cpath d=\'M25,0 L25,100\'/%3E%3Cpath d=\'M50,0 L50,100\'/%3E%3Cpath d=\'M75,0 L75,100\'/%3E%3Crect x=\'40\' y=\'40\' width=\'20\' height=\'20\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'30\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'10\'/%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.07
        }}></div>
        
        {/* Lignes rouges animées */}
        <div className="position-absolute" style={{
          width: '100%',
          height: '1px',
          left: '0',
          top: '20%',
          background: 'linear-gradient(to right, rgba(230,0,0,0) 0%, rgba(230,0,0,0.8) 50%, rgba(230,0,0,0) 100%)',
          animation: 'scanline 3s linear infinite',
          zIndex: 1
        }}></div>
        
        <div className="position-absolute" style={{
          width: '100%',
          height: '2px',
          left: '0',
          top: '70%',
          background: 'linear-gradient(to right, rgba(230,0,0,0) 0%, rgba(230,0,0,0.5) 50%, rgba(230,0,0,0) 100%)',
          animation: 'scanline 4s linear infinite reverse',
          zIndex: 1
        }}></div>

        <style jsx="true">{`
          @keyframes scanline {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(230, 0, 0, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(230, 0, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(230, 0, 0, 0); }
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .tech-glow {
            box-shadow: 0 0 15px rgba(230, 0, 0, 0.7);
            transition: all 0.3s ease;
          }
          .tech-glow:hover {
            box-shadow: 0 0 20px rgba(230, 0, 0, 0.9);
          }
          .sim-result-box {
            position: relative;
            border: 1px solid rgba(230, 0, 0, 0.3);
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(4px);
          }
          .sim-result-box::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, transparent 0%, rgba(230, 0, 0, 0.05) 50%, transparent 100%);
            z-index: 0;
          }
          .sim-indicator {
            height: 30px;
            overflow: hidden;
            position: relative;
            background: rgba(240, 240, 240, 0.8);
          }
          .sim-progress {
            height: 100%;
            background: linear-gradient(90deg, #e60000, #ff3333);
            position: relative;
            transition: width 1.5s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .sim-progress::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0) 100%);
            animation: sweep 2s ease-in-out infinite;
          }
          @keyframes sweep {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .tech-select {
            background: rgba(255, 255, 255, 0.9) !important;
            border: 1px solid rgba(230, 0, 0, 0.3) !important;
            color: #000000 !important;
            transition: all 0.3s ease;
          }
          .tech-select:focus {
            box-shadow: 0 0 0 0.25rem rgba(230, 0, 0, 0.25) !important;
            border-color: rgba(230, 0, 0, 0.5) !important;
          }
          .tech-select:disabled {
            background: rgba(240, 240, 240, 0.9) !important;
            color: rgba(0, 0, 0, 0.5) !important;
          }
          .tech-button {
            background: #e60000 !important;
            border: none !important;
            position: relative;
            z-index: 1;
            overflow: hidden;
            transition: all 0.3s ease !important;
          }
          .tech-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: all 0.6s ease;
            z-index: -1;
          }
          .tech-button:hover::before {
            left: 100%;
          }
        `}</style>

        <Container className="position-relative" style={{ zIndex: 2 }}>
          <div className="text-center mb-5">
            {/* Titre avec effet technologique */}
            <div className="d-inline-block position-relative mb-2" id="simulateur">
              <h5 className="text-black fw-bold" style={{
                letterSpacing: '5px',
                border: '1px solid rgba(230,0,0,0.5)',
                padding: '8px 20px',
                backgroundColor: 'rgba(255,255,255,0.7)',
                position: 'relative',
                textTransform: 'uppercase'
              }}>
                <span style={{color: '#e60000', textShadow: '0 0 10px rgba(230,0,0,0.3)'}}>SIMULATEUR</span>
              </h5>
              {/* Coin décoratif */}
              <div className="position-absolute" style={{
                top: -5,
                left: -5,
                width: '15px',
                height: '15px',
                borderTop: '2px solid #e60000',
                borderLeft: '2px solid #e60000'
              }}></div>
              <div className="position-absolute" style={{
                bottom: -5,
                right: -5,
                width: '15px',
                height: '15px',
                borderBottom: '2px solid #e60000',
                borderRight: '2px solid #e60000'
              }}></div>
            </div>
            
            <h2 className="display-6 fw-bold text-black mb-4" style={{textShadow: '0 0 1px rgba(0,0,0,0.1)'}}>
              ANALYSE DE <span style={{color: '#e60000'}}>PERFORMANCE</span> MOTEUR
            </h2>
            
            <div className="mx-auto" style={{
              width: '80px', 
              height: '2px', 
              background: 'linear-gradient(to right, transparent, #e60000, transparent)'
            }}></div>
          </div>
          
          <Card className="border-0 shadow-lg" style={{ 
            background: 'rgba(255,255,255,0.9)', 
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(230,0,0,0.2)',
            boxShadow: '0 0 30px rgba(230,0,0,0.1), 0 15px 25px rgba(0,0,0,0.1)'
          }}>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" role="status" style={{color: '#e60000'}}>
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                  <p className="mt-3 text-dark">Analyse des données véhicules en cours...</p>
                </div>
              ) : (
                <Row className="g-0">
                  <Col lg={6} className="p-4 border-end border-light" style={{
                    background: 'linear-gradient(to bottom, rgba(252,252,252,0.9), rgba(247,247,247,0.9))'
                  }}>
                    <div className="d-flex align-items-center mb-4">
                      <div style={{
                        width: '5px',
                        height: '25px',
                        background: '#e60000',
                        marginRight: '10px'
                      }}></div>
                      <h4 className="text-dark mb-0" style={{
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: '600'
                      }}>Configuration véhicule</h4>
                    </div>
                    
                    <Form>
                      <Row className="g-3">
                        <Col md={6}>
                          <Form.Group className="mb-3 position-relative">
                            <Form.Label className="text-dark" style={{fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px'}}>
                              Marque
                            </Form.Label>
                            <Form.Select 
                              value={selectedBrand}
                              onChange={handleBrandChange}
                              className="tech-select"
                            >
                              <option value="">Sélectionnez une marque</option>
                              {brands.map((brand) => (
                                <option key={brand} value={brand}>{brand}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3 position-relative">
                            <Form.Label className="text-dark" style={{fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px'}}>
                              Modèle
                            </Form.Label>
                            <Form.Select 
                              value={selectedModel}
                              onChange={handleModelChange}
                              disabled={!selectedBrand}
                              className="tech-select"
                            >
                              <option value="">Sélectionnez un modèle</option>
                              {modelOptions.map((model) => (
                                <option key={model} value={model}>{model}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3 position-relative">
                            <Form.Label className="text-dark" style={{fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px'}}>
                              Année
                            </Form.Label>
                            <Form.Select 
                              value={selectedYear}
                              onChange={handleYearChange}
                              disabled={!selectedModel}
                              className="tech-select"
                            >
                              <option value="">Sélectionnez l'année</option>
                              {yearOptions.map((year) => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3 position-relative">
                            <Form.Label className="text-dark" style={{fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px'}}>
                              Motorisation
                            </Form.Label>
                            <Form.Select 
                              value={selectedEngine}
                              onChange={handleEngineChange}
                              disabled={!selectedYear}
                              className="tech-select"
                            >
                              <option value="">Sélectionnez une motorisation</option>
                              {engineOptions.map((engine) => (
                                <option key={engine} value={engine}>{engine}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col xs={12}>
                          <Button 
                            className="w-100 py-3 mt-3 tech-button"
                            onClick={simulateGains}
                            disabled={!selectedEngine}
                            style={{
                              textTransform: 'uppercase',
                              fontWeight: 'bold',
                              letterSpacing: '1px',
                            }}
                          >
                            <i className="fas fa-tachometer-alt me-2"></i>
                            Lancer l'analyse de performance
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </Col>
                  
                  <Col lg={6} className="p-4" style={{
                    background: 'linear-gradient(to bottom, rgba(245,245,245,0.95), rgba(240,240,240,0.95))',
                    borderLeft: '1px solid rgba(230,0,0,0.05)'
                  }}>
                    {simulationResult ? (
                      <div className="results-container position-relative">
                        <div className="d-flex align-items-center mb-4">
                          <div style={{
                            width: '5px',
                            height: '25px',
                            background: '#e60000',
                            marginRight: '10px'
                          }}></div>
                          <h4 className="text-dark mb-0" style={{
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontWeight: '600'
                          }}>Résultats d'analyse</h4>
                        </div>
                        
                        <div className="mb-3 p-2 sim-result-box">
                          <div className="text-center mb-1">
                            <h6 className="text-muted mb-0" style={{fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px'}}>
                              Véhicule analysé
                            </h6>
                            <p className="text-dark mb-0 fw-bold" style={{fontSize: '0.85rem'}}>
                              {selectedBrand} {selectedModel} {selectedYear} - {selectedEngine}
                            </p>
                          </div>
                        </div>
                        
                        <Row className="g-3 mb-2">
                          <Col xs={6}>
                            <div className="p-2 sim-result-box" style={{background: 'rgba(240,240,240,0.5)'}}>
                              <div className="text-center">
                                <h6 className="text-muted mb-0" style={{fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Puissance d'origine</h6>
                                <div className="d-flex align-items-center justify-content-center">
                                  <span className="fw-bold text-dark" style={{fontSize: '1.5rem', lineHeight: '1.2'}}>{simulationResult.power}</span>
                                  <span className="ms-1 text-dark" style={{fontSize: '0.7rem'}}>ch</span>
                                </div>
                              </div>
                            </div>
                          </Col>
                          <Col xs={6}>
                            <div className="p-2 sim-result-box" style={{borderColor: 'rgba(230,0,0,0.7)', background: 'rgba(255,245,245,0.8)'}}>
                              <div className="text-center">
                                <h6 className="text-muted mb-0" style={{fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Puissance optimisée</h6>
                                <div className="d-flex align-items-center justify-content-center mb-0">
                                  <span className="fw-bold" style={{fontSize: '1.5rem', lineHeight: '1.2', color: '#e60000'}}>{simulationResult.tuned_power}</span>
                                  <span className="ms-1 text-dark" style={{fontSize: '0.7rem'}}>ch</span>
                                </div>
                                <div>
                                  <span className="badge" style={{background: '#e60000', animation: 'blink 1.5s infinite', fontSize: '0.6rem', padding: '0.15rem 0.4rem'}}>+{simulationResult.power_gain} ch</span>
                                  <span className="ms-1 text-success" style={{fontSize: '0.6rem'}}>
                                    (+{Math.round((simulationResult.power_gain / simulationResult.power) * 100)}%)
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Col>
                        </Row>

                        <Row className="g-3 mb-3">
                          <Col xs={6}>
                            <div className="p-2 sim-result-box" style={{background: 'rgba(240,240,240,0.5)'}}>
                              <div className="text-center">
                                <h6 className="text-muted mb-0" style={{fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Couple d'origine</h6>
                                <div className="d-flex align-items-center justify-content-center">
                                  <span className="fw-bold text-dark" style={{fontSize: '1.5rem', lineHeight: '1.2'}}>{simulationResult.torque}</span>
                                  <span className="ms-1 text-dark" style={{fontSize: '0.7rem'}}>Nm</span>
                                </div>
                              </div>
                            </div>
                          </Col>
                          <Col xs={6}>
                            <div className="p-2 sim-result-box" style={{borderColor: 'rgba(230,0,0,0.7)', background: 'rgba(255,245,245,0.8)'}}>
                              <div className="text-center">
                                <h6 className="text-muted mb-0" style={{fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Couple optimisé</h6>
                                <div className="d-flex align-items-center justify-content-center mb-0">
                                  <span className="fw-bold" style={{fontSize: '1.5rem', lineHeight: '1.2', color: '#e60000'}}>{simulationResult.tuned_torque}</span>
                                  <span className="ms-1 text-dark" style={{fontSize: '0.7rem'}}>Nm</span>
                                </div>
                                <div>
                                  <span className="badge" style={{background: '#e60000', animation: 'blink 1.5s infinite', fontSize: '0.6rem', padding: '0.15rem 0.4rem'}}>+{simulationResult.torque_gain} Nm</span>
                                  <span className="ms-1 text-success" style={{fontSize: '0.6rem'}}>
                                    (+{Math.round((simulationResult.torque_gain / simulationResult.torque) * 100)}%)
                                  </span>
                                </div>
                              </div>
                            </div>
          </Col>
        </Row>

                        <div className="d-flex justify-content-between mt-2">
                          <Button 
                            variant="outline-dark" 
                            className="px-3"
                            style={{ borderColor: 'rgba(0,0,0,0.2)', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                            onClick={() => {
                              setSimulationResult(null);
                            }}
                          >
                            <i className="fas fa-redo-alt me-1"></i> Autre simulation
                          </Button>
                          <Link to="/upload">
                            <Button 
                              style={{ 
                                background: '#e60000',
                                border: 'none',
                                boxShadow: '0 0 15px rgba(230,0,0,0.4)',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                padding: '0.3rem 0.6rem'
                              }}
                              className="tech-glow"
                            >
                              <i className="fas fa-bolt me-1"></i> Optimiser mon véhicule
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="d-flex flex-column justify-content-center align-items-center h-100" style={{ minHeight: '400px' }}>
                        <div className="text-center position-relative">
                          <div className="position-relative" style={{
                            width: '120px',
                            height: '120px',
                            margin: '0 auto',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(230,0,0,0.1) 0%, rgba(255,255,255,0) 70%)',
                            boxShadow: '0 0 30px rgba(230,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <i className="fas fa-tachometer-alt fa-4x" style={{ color: 'rgba(230,0,0,0.7)' }}></i>
                          </div>
                          <div className="position-absolute" style={{
                            width: '140px',
                            height: '140px',
                            top: '-10px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            border: '1px solid rgba(230,0,0,0.2)',
                            borderRadius: '50%'
                          }}></div>
                          <div className="position-absolute" style={{
                            width: '160px',
                            height: '160px',
                            top: '-20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            border: '1px solid rgba(230,0,0,0.1)',
                            borderRadius: '50%'
                          }}></div>
                          
                          <h5 className="text-dark mt-4">Analyse de performance</h5>
                          <p className="text-muted mb-0" style={{maxWidth: '300px', margin: '0 auto'}}>
                            Sélectionnez votre véhicule pour découvrir son potentiel d'optimisation
                          </p>
                        </div>
                </div>
                    )}
                  </Col>
                </Row>
              )}
              </Card.Body>
            </Card>
          
          <div className="text-center mt-4" style={{opacity: '0.7'}}>
            <p className="text-dark" style={{fontSize: '0.85rem'}}>
              <i className="fas fa-info-circle me-2"></i>
              Les estimations sont basées sur des données réelles et peuvent varier selon les spécificités de votre véhicule
            </p>
          </div>
        </Container>
      </div>

      {/* Section Tarification indépendante avec design cohérent */}
      <div className="pricing-section position-relative py-5" style={{ 
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="position-absolute w-100 h-100" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23e60000\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.2
        }}></div>

        <Container className="position-relative" style={{ zIndex: 2 }}>
          <div className="text-center mb-5 slide-up">
            <h5 className="text-danger fw-bold mb-2" style={{letterSpacing: '3px'}}>TARIFICATION</h5>
            <h2 className="display-6 fw-bold text-white mb-4">Nos offres de crédits</h2>
            <div className="mx-auto" style={{width: '50px', height: '3px', background: '#e60000'}}></div>
          </div>
          
          <Row className="g-4 mb-3">
            {[
              { credits: 1, price: 8, popular: false, description: "Pour un besoin ponctuel" },
              { credits: 25, price: 190, popular: false, description: "Idéal pour les petits ateliers" },
              { credits: 50, price: 370, popular: true, description: "Notre offre la plus populaire" },
              { credits: 100, price: 720, popular: false, description: "Pour les garages spécialisés" },
              { credits: 1000, price: 7000, popular: false, description: "Solution professionnelle complète" }
            ].map((pack, index) => (
              <Col md={6} lg={4} key={index} className="slide-up" style={{ animationDelay: `${0.1 * (index + 1)}s` }}>
                <Card className="h-100 price-card position-relative" style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '0',
                  border: 'none',
                  backdropFilter: 'blur(5px)',
                  transition: 'all 0.4s ease',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}>
                  {pack.popular && (
                    <div className="position-absolute" style={{
                      top: '12px',
                      right: '-30px',
                      transform: 'rotate(45deg)',
                      background: '#e60000',
                      color: 'white',
                      padding: '5px 30px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      zIndex: 10
                    }}>POPULAIRE</div>
                  )}
                  <Card.Body className="p-4 text-center">
                    <div className="mb-3">
                      <h3 className="text-white fw-bold">{pack.credits} crédit{pack.credits > 1 ? 's' : ''}</h3>
                      <div className="price-value mt-2">
                        <span className="display-5 fw-bold text-danger">{pack.price} DT</span>
                        <span className="text-light"> ht</span>
                      </div>
                      {pack.credits > 1 && (
                        <div className="mt-1 text-success fw-bold">
                          {Math.round((1 - (pack.price / pack.credits) / 8) * 100)}% d'économie
                        </div>
                      )}
                      <div className="text-light opacity-75 mt-2 mb-4">
                        {(pack.price / pack.credits).toFixed(2)} DT ht par crédit
                      </div>
                    </div>
                    <div className="price-description mb-4">
                      <p className="text-light">{pack.description}</p>
                </div>
                    <Link to="/buy-credits">
                      <Button 
                        variant={pack.popular ? "danger" : "outline-danger"} 
                        size="lg"
                        className="w-100 py-2"
                        style={{ borderRadius: '0' }}
                      >
                        Acheter maintenant
                      </Button>
                    </Link>
              </Card.Body>
                  {pack.popular && (
                    <div className="position-absolute" style={{
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      height: '3px',
                      background: 'linear-gradient(to right, transparent, #e60000, transparent)'
                    }}></div>
                  )}
            </Card>
          </Col>
            ))}
          </Row>
          <div className="text-center mt-4 slide-up" style={{ animationDelay: '0.6s' }}>
            <p className="text-light mb-0">Besoin d'une offre sur mesure pour votre entreprise?</p>
            <Link to="/contact">
              <Button 
                variant="link" 
                className="text-danger fw-bold mt-2"
              >
                Contactez-nous pour un devis personnalisé <i className="fas fa-arrow-right ms-2"></i>
              </Button>
            </Link>
          </div>
        </Container>
      </div>

      {/* Section Comment ça marche en design plus dynamique */}
      <div className="bg-black text-white p-5 my-5">
        <div className="text-center mb-5">
          <h5 className="text-danger fw-bold mb-2" style={{letterSpacing: '3px'}}>PROCESSUS SIMPLE</h5>
          <h2 className="display-6 fw-bold text-white mb-4">Comment ça marche</h2>
          <div className="mx-auto" style={{width: '50px', height: '3px', background: '#e60000'}}></div>
        </div>
        
        <Row className="g-4">
          {[
            {
              num: "01",
              title: "Inscription",
              icon: "fa-user-plus",
              text: "Créez votre compte et achetez des crédits pour commencer à utiliser nos services."
            },
            {
              num: "02",
              title: "Envoi du fichier",
              icon: "fa-file-upload",
              text: "Envoyez votre fichier ECU original avec les spécifications de performance souhaitées."
            },
            {
              num: "03",
              title: "Traitement",
              icon: "fa-cogs",
              text: "Nos experts analysent et traitent votre fichier selon les besoins que vous avez définis."
            },
            {
              num: "04", 
              title: "Téléchargement",
              icon: "fa-download",
              text: "Téléchargez votre fichier optimisé et installez-le sur votre véhicule."
            }
          ].map((step, index) => (
            <Col md={3} key={index}>
              <div className="position-relative mb-4">
                <div className="position-relative">
                  <span className="d-block text-danger fw-bold" style={{
                    fontSize: '60px',
                    lineHeight: 1,
                    fontStyle: 'italic'
                  }}>{step.num}</span>
                  <div className="position-absolute" style={{
                    top: '15px',
                    right: '0',
                    background: '#e60000',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className={`fas ${step.icon} fa-lg text-white`}></i>
                  </div>
                </div>
              </div>
              <h4 className="fw-bold mb-3">{step.title}</h4>
              <p>{step.text}</p>
          </Col>
          ))}
        </Row>
      </div>
      
      {/* Section finale avec CTA */}
      <div className="cta-section position-relative py-5" style={{ 
        background: 'linear-gradient(135deg, #000000 0%, #1a0000 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid rgba(230,0,0,0.3)'
      }}>
        {/* Éléments de design */}
        <div className="position-absolute" style={{
          width: '100%',
          height: '1px',
          left: '0',
          top: '30%',
          background: 'linear-gradient(to right, rgba(230,0,0,0) 0%, rgba(230,0,0,0.5) 50%, rgba(230,0,0,0) 100%)',
          zIndex: 1
        }}></div>
        
        <div className="position-absolute" style={{
          width: '150px',
          height: '150px',
          top: '-75px',
          right: '10%',
          background: 'radial-gradient(circle, rgba(230,0,0,0.2) 0%, transparent 70%)',
          borderRadius: '50%'
        }}></div>
        
        <div className="position-absolute" style={{
          width: '200px',
          height: '200px',
          bottom: '-100px',
          left: '5%',
          background: 'radial-gradient(circle, rgba(230,0,0,0.1) 0%, transparent 70%)',
          borderRadius: '50%'
        }}></div>
        
        <Container className="position-relative py-5" style={{ zIndex: 2 }}>
          <Row className="align-items-center justify-content-between">
            <Col lg={7} className="mb-4 mb-lg-0">
              <div className="position-relative" style={{
                background: 'rgba(0,0,0,0.4)',
                padding: '30px',
                border: '1px solid rgba(230,0,0,0.2)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3), 0 0 20px rgba(230,0,0,0.2) inset'
              }}>
                <div className="position-absolute" style={{
                  width: '50px', 
                  height: '50px', 
                  top: '-5px', 
                  left: '-5px',
                  borderTop: '2px solid #e60000',
                  borderLeft: '2px solid #e60000'
                }}></div>
                <div className="position-absolute" style={{
                  width: '50px', 
                  height: '50px', 
                  bottom: '-5px', 
                  right: '-5px',
                  borderBottom: '2px solid #e60000',
                  borderRight: '2px solid #e60000'
                }}></div>
                <h2 className="fw-bold mb-3" style={{
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  textShadow: '0 0 10px rgba(230,0,0,0.3)'
                }}>
                  Prêt à <span style={{color: '#e60000', textShadow: '0 0 15px rgba(230,0,0,0.5)'}}>booster</span> les performances de votre véhicule ?
                </h2>
                <p className="lead mb-0 text-light opacity-75" style={{maxWidth: '600px'}}>
                  Rejoignez les professionnels qui font confiance à notre plateforme pour optimiser les performances des véhicules de leurs clients.
                </p>
              </div>
            </Col>
            <Col lg={4} className="text-center">
              <div className="position-relative" style={{
                background: 'radial-gradient(circle at center, rgba(230,0,0,0.2) 0%, transparent 70%)',
                padding: '30px'
              }}>
                <Link to="/register">
                  <Button 
                    variant="danger" 
                    size="lg" 
                    className="px-4 py-3 position-relative shadow-lg" 
                    style={{
                      borderRadius: '0',
                      border: 'none',
                      boxShadow: '0 0 20px rgba(230,0,0,0.4), 0 0 30px rgba(230,0,0,0.2) inset',
                      background: 'linear-gradient(135deg, #e60000, #aa0000)',
                      overflow: 'hidden',
                      transform: 'skewX(-5deg)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span className="position-relative" style={{
                      zIndex: 2, 
                      fontWeight: 'bold', 
                      letterSpacing: '1px',
                      display: 'block',
                      transform: 'skewX(5deg)'
                    }}>
                      COMMENCER MAINTENANT <i className="fas fa-arrow-right ms-2"></i>
                    </span>
                    <div className="position-absolute" style={{
                      top: 0,
                      left: '-100%',
                      width: '200%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      animation: 'shine 2s infinite',
                      zIndex: 1
                    }}></div>
                  </Button>
                </Link>
                <div className="mt-3" style={{color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem'}}>
                  <i className="fas fa-shield-alt me-2" style={{color: '#e60000'}}></i>
                  Sécurisé et professionnel
                </div>
              </div>
          </Col>
        </Row>
      </Container>
      </div>

      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}
    </>
  );
};

export default Home; 
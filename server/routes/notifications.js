const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// @route   GET api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (err) {
    console.error('Erreur lors de la récupération des notifications:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   PUT api/notifications/read/:id
// @desc    Mark a notification as read
// @access  Private
router.put('/read/:id', auth, async (req, res) => {
  try {
    let notification = await Notification.findById(req.params.id);

    // Vérifier que la notification existe
    if (!notification) {
      return res.status(404).json({ msg: 'Notification non trouvée' });
    }

    // Vérifier que l'utilisateur est propriétaire de la notification
    if (notification.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Non autorisé' });
    }

    notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    res.json(notification);
  } catch (err) {
    console.error('Erreur lors du marquage de la notification:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   PUT api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );

    res.json({ msg: 'Toutes les notifications ont été marquées comme lues' });
  } catch (err) {
    console.error('Erreur lors du marquage des notifications:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   DELETE api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    // Vérifier que la notification existe
    if (!notification) {
      return res.status(404).json({ msg: 'Notification non trouvée' });
    }

    // Vérifier que l'utilisateur est propriétaire de la notification
    if (notification.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Non autorisé' });
    }

    await Notification.findByIdAndRemove(req.params.id);
    res.json({ msg: 'Notification supprimée' });
  } catch (err) {
    console.error('Erreur lors de la suppression de la notification:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   DELETE api/notifications
// @desc    Delete all user notifications
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });
    res.json({ msg: 'Toutes les notifications ont été supprimées' });
  } catch (err) {
    console.error('Erreur lors de la suppression des notifications:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET api/notifications/unread-count
// @desc    Get count of unread notifications
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      read: false
    });

    res.json({ count });
  } catch (err) {
    console.error('Erreur lors du comptage des notifications:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router; 
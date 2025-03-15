const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EcuFileSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected'],
    default: 'pending'
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    default: null,
    _commentForDevs: "Ce champ représente l'administrateur qui traite le fichier"
  },
  vehicleInfo: {
    type: {
      type: String,
      required: true
    },
    manufacturer: {
      type: String,
      required: true
    },
    model: {
      type: String,
      required: true
    },
    year: {
      type: String,
      required: true
    },
    engine: {
      type: String,
      required: true
    },
    transmission: {
      type: String,
      required: true
    },
    mileage: {
      type: Number
    },
    licensePlate: {
      type: String
    },
    vin: {
      type: String
    }
  },
  fileInfo: {
    reprogrammingTool: {
      type: String,
      required: true
    },
    readMethod: {
      type: String,
      required: true
    },
    ecuBrand: {
      type: String
    },
    ecuType: {
      type: String
    },
    hwNumber: {
      type: String
    },
    swNumber: {
      type: String
    },
    originalFilePath: {
      type: String,
      required: true
    },
    modifiedFilePath: {
      type: String
    },
    originalFileName: {
      type: String
    },
    modifiedFileName: {
      type: String
    }
  },
  options: {
    powerIncrease: {
      type: String,
      enum: ['Stage 1', 'Stage 2', 'Custom', '']
    },
    dpfOff: {
      type: Boolean,
      default: false
    },
    opfOff: {
      type: Boolean,
      default: false
    },
    catalystOff: {
      type: Boolean,
      default: false
    },
    popAndBang: {
      type: Boolean,
      default: false
    },
    adBlueOff: {
      type: Boolean,
      default: false
    },
    egrOff: {
      type: Boolean,
      default: false
    },
    dtcRemoval: {
      type: Boolean,
      default: false
    },
    vmaxOff: {
      type: Boolean,
      default: false
    },
    startStopOff: {
      type: Boolean,
      default: false
    }
  },
  totalCredits: {
    type: Number,
    required: true
  },
  comments: {
    type: String
  },
  discussionComments: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
      },
      text: {
        type: String,
        required: true
      },
      imagePath: {
        type: String
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  statusHistory: [
    {
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'rejected'],
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      comment: {
        type: String
      },
      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'user'
      }
    }
  ],
  processingHistory: [
    {
      adminId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
      },
      action: {
        type: String,
        enum: ['started_processing', 'uploaded_file', 'completed', 'rejected'],
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      comment: {
        type: String
      }
    }
  ],
  notifications: [
    {
      type: {
        type: String,
        enum: ['download_ready', 'status_update', 'file_rejected', 'processing_started', 'comment_added'],
        required: true
      },
      message: {
        type: String,
        required: true
      },
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: {
        type: Date
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ecuFile', EcuFileSchema); 
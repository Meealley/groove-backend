const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    // File identification
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    
    // File ownership
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // File storage information
    storage: {
      // Storage provider
      provider: {
        type: String,
        enum: ["local", "aws_s3", "azure_blob", "google_cloud", "dropbox", "onedrive"],
        default: "local",
      },
      
      // File paths and URLs
      path: String,        // Internal storage path
      url: String,         // Access URL
      cdnUrl: String,      // CDN URL if available
      
      // Storage bucket/container info
      bucket: String,
      region: String,
      
      // File hash for integrity
      hash: {
        md5: String,
        sha256: String,
      },
      
      // Encryption information
      encryption: {
        encrypted: {
          type: Boolean,
          default: false,
        },
        algorithm: String,
        keyId: String,
      },
    },
    
    // File metadata
    metadata: {
      // Basic file info
      size: {
        type: Number,
        required: true,
      }, // bytes
      mimeType: {
        type: String,
        required: true,
      },
      extension: String,
      
      // File type categorization
      category: {
        type: String,
        enum: [
          "image",
          "video", 
          "audio",
          "document",
          "spreadsheet",
          "presentation",
          "archive",
          "code",
          "text",
          "other"
        ],
      },
      
      // Detailed metadata based on file type
      imageMetadata: {
        width: Number,
        height: Number,
        format: String,
        colorSpace: String,
        hasAlpha: Boolean,
        dpi: Number,
        camera: {
          make: String,
          model: String,
          software: String,
        },
        location: {
          coordinates: [Number], // [longitude, latitude]
          address: String,
        },
        takenAt: Date,
      },
      
      videoMetadata: {
        duration: Number, // seconds
        width: Number,
        height: Number,
        fps: Number,
        bitrate: Number,
        codec: String,
        audioCodec: String,
        aspectRatio: String,
        thumbnails: [{
          timestamp: Number, // seconds
          url: String,
        }],
      },
      
      audioMetadata: {
        duration: Number, // seconds
        bitrate: Number,
        sampleRate: Number,
        channels: Number,
        codec: String,
        artist: String,
        album: String,
        title: String,
        year: Number,
      },
      
      documentMetadata: {
        pageCount: Number,
        wordCount: Number,
        language: String,
        author: String,
        title: String,
        subject: String,
        keywords: [String],
        createdAt: Date,
        modifiedAt: Date,
        hasPassword: Boolean,
      },
    },
    
    // File relationships
    relationships: {
      // Parent entities this file is attached to
      attachedTo: [{
        entityType: {
          type: String,
          enum: ["task", "project", "goal", "comment", "user", "team", "template"],
        },
        entityId: mongoose.Schema.Types.ObjectId,
        attachmentType: {
          type: String,
          enum: ["attachment", "avatar", "cover", "thumbnail", "document", "media"],
          default: "attachment",
        },
        attachedAt: {
          type: Date,
          default: Date.now,
        },
      }],
      
      // File versions (for version control)
      versions: [{
        version: String,
        fileId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "File",
        },
        createdAt: Date,
        changes: String,
        size: Number,
      }],
      
      // Related files
      related: [{
        fileId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "File",
        },
        relationship: {
          type: String,
          enum: ["thumbnail", "preview", "converted", "source", "derivative"],
        },
        createdAt: Date,
      }],
      
      // File dependencies
      dependencies: [{
        fileId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "File",
        },
        dependencyType: String,
      }],
    },
    
    // Access control and permissions
    permissions: {
      // Visibility level
      visibility: {
        type: String,
        enum: ["private", "team", "project", "organization", "public"],
        default: "private",
      },
      
      // Specific user permissions
      users: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        permission: {
          type: String,
          enum: ["view", "download", "edit", "admin"],
          default: "view",
        },
        grantedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        grantedAt: Date,
        expiresAt: Date,
      }],
      
      // Team permissions
      teams: [{
        team: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Team",
        },
        permission: {
          type: String,
          enum: ["view", "download", "edit", "admin"],
          default: "view",
        },
      }],
      
      // Public access settings
      publicAccess: {
        enabled: {
          type: Boolean,
          default: false,
        },
        allowDownload: {
          type: Boolean,
          default: false,
        },
        requireSignup: {
          type: Boolean,
          default: false,
        },
        expiresAt: Date,
        passwordProtected: {
          type: Boolean,
          default: false,
        },
        password: String, // Hashed
      },
    },
    
    // Processing and transformations
    processing: {
      // Processing status
      status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed", "queued"],
        default: "pending",
      },
      
      // Processing queue
      queue: {
        priority: {
          type: Number,
          default: 0,
        },
        attempts: {
          type: Number,
          default: 0,
        },
        lastAttempt: Date,
        nextAttempt: Date,
        errors: [String],
      },
      
      // Available processing options
      availableProcessing: [{
        type: {
          type: String,
          enum: [
            "thumbnail_generation",
            "preview_generation", 
            "format_conversion",
            "compression",
            "ocr_extraction",
            "content_analysis",
            "virus_scan",
            "metadata_extraction"
          ],
        },
        status: {
          type: String,
          enum: ["pending", "completed", "failed", "skipped"],
          default: "pending",
        },
        result: String,
        processedAt: Date,
      }],
      
      // Generated variants
      variants: [{
        type: {
          type: String,
          enum: ["thumbnail", "preview", "compressed", "converted"],
        },
        format: String,
        size: Number,
        url: String,
        width: Number,
        height: Number,
        quality: Number,
        createdAt: Date,
      }],
    },
    
    // Content analysis and AI
    analysis: {
      // AI-powered content analysis
      aiAnalysis: {
        // Image analysis
        imageLabels: [{
          label: String,
          confidence: Number,
          boundingBox: {
            x: Number,
            y: Number,
            width: Number,
            height: Number,
          },
        }],
        
        // Text extraction (OCR)
        extractedText: String,
        
        // Document analysis
        documentStructure: {
          headings: [String],
          sections: [String],
          keyPhrases: [String],
          summary: String,
        },
        
        // Content moderation
        moderation: {
          isAppropriate: Boolean,
          confidence: Number,
          flags: [String],
          categories: [String],
        },
        
        // Sentiment analysis (for text content)
        sentiment: {
          score: Number, // -1 to 1
          magnitude: Number,
          label: {
            type: String,
            enum: ["positive", "neutral", "negative"],
          },
        },
      },
      
      // Search and indexing
      searchIndex: {
        content: String,      // Searchable text content
        keywords: [String],   // Extracted keywords
        tags: [String],       // User-defined tags
        lastIndexed: Date,
        searchBoost: {
          type: Number,
          default: 1,
        },
      },
      
      // Content classification
      classification: {
        category: String,
        subcategory: String,
        confidence: Number,
        tags: [String],
        isPersonal: Boolean,
        isSensitive: Boolean,
        businessRelevance: Number, // 0-1
      },
    },
    
    // Usage and analytics
    analytics: {
      // Access statistics
      access: {
        totalViews: {
          type: Number,
          default: 0,
        },
        uniqueViews: {
          type: Number,
          default: 0,
        },
        totalDownloads: {
          type: Number,
          default: 0,
        },
        uniqueDownloads: {
          type: Number,
          default: 0,
        },
        lastAccessed: Date,
        lastDownloaded: Date,
      },
      
      // Detailed access log
      accessLog: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        action: {
          type: String,
          enum: ["view", "download", "edit", "share", "delete"],
        },
        timestamp: Date,
        ipAddress: String,
        userAgent: String,
        referrer: String,
      }],
      
      // Performance metrics
      performance: {
        avgLoadTime: Number,     // milliseconds
        errorRate: Number,       // percentage
        cacheHitRate: Number,    // percentage
        bandwidthUsage: Number,  // bytes
      },
      
      // Engagement metrics
      engagement: {
        shareCount: {
          type: Number,
          default: 0,
        },
        bookmarkCount: {
          type: Number,
          default: 0,
        },
        commentCount: {
          type: Number,
          default: 0,
        },
        reactionCount: {
          type: Number,
          default: 0,
        },
      },
    },
    
    // Security and compliance
    security: {
      // Virus scanning
      virusScan: {
        scanned: {
          type: Boolean,
          default: false,
        },
        clean: Boolean,
        scanDate: Date,
        scanner: String,
        threats: [String],
      },
      
      // Content filtering
      contentFilter: {
        filtered: {
          type: Boolean,
          default: false,
        },
        reasons: [String],
        severity: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
        },
      },
      
      // Digital signatures
      signature: {
        signed: {
          type: Boolean,
          default: false,
        },
        signedBy: String,
        signedAt: Date,
        certificate: String,
        valid: Boolean,
      },
      
      // Watermarking
      watermark: {
        hasWatermark: {
          type: Boolean,
          default: false,
        },
        watermarkType: String,
        watermarkData: String,
      },
    },
    
    // Lifecycle management
    lifecycle: {
      // File status
      status: {
        type: String,
        enum: ["active", "archived", "deleted", "quarantined", "expired"],
        default: "active",
      },
      
      // Retention policy
      retention: {
        retentionPeriod: Number, // days
        retentionReason: String,
        deleteAfter: Date,
        autoDelete: {
          type: Boolean,
          default: false,
        },
      },
      
      // Backup information
      backup: {
        backedUp: {
          type: Boolean,
          default: false,
        },
        backupDate: Date,
        backupLocation: String,
        restorable: {
          type: Boolean,
          default: true,
        },
      },
      
      // Migration tracking
      migration: {
        migrated: {
          type: Boolean,
          default: false,
        },
        fromProvider: String,
        toProvider: String,
        migratedAt: Date,
        migrationReason: String,
      },
    },
    
    // Integration and sync
    integration: {
      // External service sync
      externalSync: [{
        service: String,
        externalId: String,
        syncStatus: {
          type: String,
          enum: ["synced", "pending", "failed", "disabled"],
        },
        lastSync: Date,
        syncError: String,
      }],
      
      // Webhook notifications
      webhooks: [{
        url: String,
        events: [String], // "upload", "download", "delete", etc.
        active: Boolean,
        lastTriggered: Date,
      }],
    },
    
    // Comments and collaboration
    collaboration: {
      // Comments on the file
      comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      }],
      
      // File sharing
      shares: [{
        sharedWith: {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          email: String, // For external sharing
        },
        sharedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        sharedAt: Date,
        permission: String,
        message: String,
        expiresAt: Date,
        accessed: {
          type: Boolean,
          default: false,
        },
        accessedAt: Date,
      }],
      
      // File locks (for editing)
      lock: {
        isLocked: {
          type: Boolean,
          default: false,
        },
        lockedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        lockedAt: Date,
        lockExpires: Date,
        lockReason: String,
      },
    },
    
    // Workflow and automation
    workflow: {
      // Automated actions
      automatedActions: [{
        trigger: String,
        action: String,
        condition: String,
        executed: Boolean,
        executedAt: Date,
        result: String,
      }],
      
      // Approval workflow
      approvalWorkflow: {
        required: {
          type: Boolean,
          default: false,
        },
        approvers: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        }],
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        approvedAt: Date,
        rejectionReason: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ "metadata.mimeType": 1 });
fileSchema.index({ "metadata.category": 1 });
fileSchema.index({ "relationships.attachedTo.entityType": 1, "relationships.attachedTo.entityId": 1 });
fileSchema.index({ "permissions.visibility": 1 });
fileSchema.index({ "lifecycle.status": 1 });
fileSchema.index({ "analysis.searchIndex.content": "text" });
fileSchema.index({ "storage.hash.md5": 1 });

// Virtual for formatted file size
fileSchema.virtual('formattedSize').get(function() {
  const bytes = this.metadata.size;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for file type
fileSchema.virtual('fileType').get(function() {
  return this.metadata.category || 'other';
});

// Virtual for is image
fileSchema.virtual('isImage').get(function() {
  return this.metadata.category === 'image';
});

// Virtual for is video
fileSchema.virtual('isVideo').get(function() {
  return this.metadata.category === 'video';
});

// Virtual for is document
fileSchema.virtual('isDocument').get(function() {
  return ['document', 'spreadsheet', 'presentation'].includes(this.metadata.category);
});

// Pre-save middleware
fileSchema.pre('save', function(next) {
  // Set file category based on MIME type
  if (!this.metadata.category) {
    this.metadata.category = this.getCategoryFromMimeType();
  }
  
  // Set file extension
  if (!this.metadata.extension && this.originalName) {
    const lastDot = this.originalName.lastIndexOf('.');
    if (lastDot > 0) {
      this.metadata.extension = this.originalName.substring(lastDot + 1).toLowerCase();
    }
  }
  
  next();
});

// Method to get category from MIME type
fileSchema.methods.getCategoryFromMimeType = function() {
  const mimeType = this.metadata.mimeType;
  
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('text/')) return 'text';
  
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (documentTypes.includes(mimeType)) return 'document';
  
  const spreadsheetTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  if (spreadsheetTypes.includes(mimeType)) return 'spreadsheet';
  
  const presentationTypes = [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  if (presentationTypes.includes(mimeType)) return 'presentation';
  
  const archiveTypes = [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-tar',
    'application/gzip'
  ];
  if (archiveTypes.includes(mimeType)) return 'archive';
  
  return 'other';
};

// Method to check if user has permission
fileSchema.methods.hasPermission = function(userId, permission = 'view') {
  // File owner has all permissions
  if (this.uploadedBy.toString() === userId.toString()) {
    return true;
  }
  
  // Check explicit user permissions
  const userPermission = this.permissions.users.find(
    u => u.user.toString() === userId.toString()
  );
  
  if (userPermission) {
    const permissionLevels = ['view', 'download', 'edit', 'admin'];
    const requiredLevel = permissionLevels.indexOf(permission);
    const userLevel = permissionLevels.indexOf(userPermission.permission);
    return userLevel >= requiredLevel;
  }
  
  // Check team permissions
  // This would require looking up user's teams
  
  // Check public access
  if (this.permissions.visibility === 'public' && permission === 'view') {
    return true;
  }
  
  return false;
};

// Method to record access
fileSchema.methods.recordAccess = async function(userId, action = 'view', context = {}) {
  // Add to access log
  this.analytics.accessLog.push({
    user: userId,
    action,
    timestamp: new Date(),
    ipAddress: context.ip,
    userAgent: context.userAgent,
    referrer: context.referrer,
  });
  
  // Update counters
  if (action === 'view') {
    this.analytics.access.totalViews++;
    this.analytics.access.lastAccessed = new Date();
  } else if (action === 'download') {
    this.analytics.access.totalDownloads++;
    this.analytics.access.lastDownloaded = new Date();
  }
  
  // Keep only last 1000 access log entries
  if (this.analytics.accessLog.length > 1000) {
    this.analytics.accessLog = this.analytics.accessLog.slice(-1000);
  }
  
  await this.save();
  
  // Create activity
  const Activity = mongoose.model('Activity');
  await Activity.createActivity({
    actor: { user: userId },
    action: {
      type: `file_${action}`,
      description: `${action}ed file "${this.filename}"`,
      category: 'file_management',
    },
    target: {
      entityType: 'file',
      entityId: this._id,
      entityName: this.filename,
    },
  });
};

// Method to generate download URL
fileSchema.methods.generateDownloadUrl = function(expiresIn = 3600) {
  // This would integrate with your storage provider to generate signed URLs
  // For example, with AWS S3:
  // return s3.getSignedUrl('getObject', {
  //   Bucket: this.storage.bucket,
  //   Key: this.storage.path,
  //   Expires: expiresIn
  // });
  
  // For now, return the direct URL
  return this.storage.url;
};

// Method to create thumbnail
fileSchema.methods.createThumbnail = async function(options = {}) {
  const { width = 200, height = 200, quality = 80 } = options;
  
  if (!this.isImage) {
    throw new Error('Thumbnails can only be created for images');
  }
  
  // This would integrate with image processing library
  // For example, using Sharp or similar
  
  const thumbnailData = {
    type: 'thumbnail',
    format: 'jpeg',
    width,
    height,
    quality,
    url: `${this.storage.url}_thumb_${width}x${height}.jpg`,
    createdAt: new Date(),
  };
  
  this.processing.variants.push(thumbnailData);
  await this.save();
  
  return thumbnailData;
};

// Static method to find files by entity
fileSchema.statics.findByEntity = function(entityType, entityId) {
  return this.find({
    'relationships.attachedTo': {
      $elemMatch: {
        entityType,
        entityId,
      }
    },
    'lifecycle.status': 'active',
  }).sort({ createdAt: -1 });
};

// Static method to search files
fileSchema.statics.searchFiles = function(query, options = {}) {
  const {
    userId,
    category,
    mimeType,
    limit = 20,
    skip = 0,
  } = options;
  
  const searchQuery = {
    'lifecycle.status': 'active',
    $or: [
      { filename: { $regex: query, $options: 'i' } },
      { originalName: { $regex: query, $options: 'i' } },
      { 'analysis.searchIndex.content': { $regex: query, $options: 'i' } },
    ],
  };
  
  if (userId) {
    searchQuery.$or.push(
      { uploadedBy: userId },
      { 'permissions.users.user': userId },
      { 'permissions.visibility': 'public' }
    );
  }
  
  if (category) searchQuery['metadata.category'] = category;
  if (mimeType) searchQuery['metadata.mimeType'] = mimeType;
  
  return this.find(searchQuery)
    .populate('uploadedBy', 'name profile.avatar')
    .sort({ 'analytics.access.totalViews': -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get storage statistics
fileSchema.statics.getStorageStats = async function(userId = null) {
  const matchStage = { 'lifecycle.status': 'active' };
  if (userId) matchStage.uploadedBy = new mongoose.Types.ObjectId(userId);
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: '$metadata.size' },
        byCategory: {
          $push: {
            category: '$metadata.category',
            size: '$metadata.size',
          }
        },
      }
    },
    {
      $addFields: {
        categoryStats: {
          $reduce: {
            input: '$byCategory',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [
                    [{
                      k: '$$this.category',
                      v: {
                        $add: [
                          { $ifNull: [{ $getField: { field: '$$this.category', input: '$$value' } }, 0] },
                          '$$this.size'
                        ]
                      }
                    }]
                  ]
                }
              ]
            }
          }
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || { totalFiles: 0, totalSize: 0, categoryStats: {} };
};

const File = mongoose.model("File", fileSchema);

module.exports = File;
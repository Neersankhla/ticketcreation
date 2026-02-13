import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { 
  Settings as SettingsIcon,
  Bot,
  Clock,
  Sliders,
  Save
} from 'lucide-react'

const Settings = () => {
  const { user } = useAuth()
  const [config, setConfig] = useState({
    autoCloseEnabled: true,
    confidenceThreshold: 0.78,
    slaHours: 24,
    categoryThresholds: {
      billing: 0.78,
      tech: 0.85,
      shipping: 0.75,
      other: 0.80
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await api.get('/config')
      setConfig(response.data.config)
    } catch (error) {
      console.error('Error fetching config:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await api.put('/config', config)
      toast.success('Settings updated successfully!')
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateCategoryThreshold = (category, value) => {
    setConfig(prev => ({
      ...prev,
      categoryThresholds: {
        ...prev.categoryThresholds,
        [category]: parseFloat(value)
      }
    }))
  }

  if (user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">Only administrators can access settings.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure AI agent behavior and system parameters</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center space-x-2"
        >
          <Save size={16} />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* AI Agent Settings */}
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Bot className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">AI Agent Configuration</h2>
        </div>

        <div className="space-y-6">
          {/* Auto Close Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Auto-Close Tickets</h3>
              <p className="text-sm text-gray-600">
                Automatically resolve tickets when AI confidence is above threshold
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoCloseEnabled}
                onChange={(e) => updateConfig('autoCloseEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Global Confidence Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Global Confidence Threshold
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.confidenceThreshold}
                onChange={(e) => updateConfig('confidenceThreshold', parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium text-gray-900 min-w-[50px]">
                {Math.round(config.confidenceThreshold * 100)}%
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Tickets with AI confidence above this threshold will be auto-resolved if enabled
            </p>
          </div>

          {/* Category-Specific Thresholds */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Category-Specific Thresholds
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(config.categoryThresholds).map(([category, threshold]) => (
                <div key={category} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {category}
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={threshold}
                      onChange={(e) => updateCategoryThreshold(category, e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-900 min-w-[50px]">
                      {Math.round(threshold * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Override global threshold for specific categories
            </p>
          </div>
        </div>
      </div>

      {/* SLA Settings */}
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Clock className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-semibold text-gray-900">SLA Configuration</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Response Time SLA (Hours)
          </label>
          <input
            type="number"
            min="1"
            max="168"
            value={config.slaHours}
            onChange={(e) => updateConfig('slaHours', parseInt(e.target.value))}
            className="input-field w-32"
          />
          <p className="text-sm text-gray-600 mt-1">
            Target response time for support tickets (1-168 hours)
          </p>
        </div>
      </div>

      {/* System Information */}
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-6">
          <SettingsIcon className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">System Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">Gemini AI</div>
            <div className="text-sm text-blue-700">LLM Provider</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">Active</div>
            <div className="text-sm text-green-700">Agent Status</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">v1.0</div>
            <div className="text-sm text-purple-700">System Version</div>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Sliders className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Advanced Settings</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              AI Model Configuration
            </h3>
            <p className="text-sm text-yellow-700">
              Currently using Gemini Pro model. To change AI providers or models, 
              update the environment variables and restart the agent service.
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Performance Monitoring
            </h3>
            <p className="text-sm text-blue-700">
              Monitor agent performance and ticket resolution rates in the dashboard.
              Consider adjusting thresholds based on accuracy metrics.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings

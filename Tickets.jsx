import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import CreateTicketModal from '../components/Tickets/CreateTicketModal'
import { 
  Plus, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  Users
} from 'lucide-react'

const Tickets = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    myTickets: user.role === 'user' ? 'true' : ''
  })
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [filters])

  useEffect(() => {
    // Check if we should open create modal from URL params
    const params = new URLSearchParams(location.search)
    if (params.get('action') === 'create') {
      setShowCreateModal(true)
    }
  }, [location])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await api.get(`/tickets?${params}`)
      setTickets(response.data.tickets)
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      triaged: 'bg-yellow-100 text-yellow-800',
      waiting_human: 'bg-orange-100 text-orange-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    const icons = {
      open: <Clock size={16} />,
      triaged: <AlertCircle size={16} />,
      waiting_human: <Users size={16} />,
      resolved: <CheckCircle size={16} />,
      closed: <CheckCircle size={16} />
    }
    return icons[status] || <Clock size={16} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600">
            {user.role === 'user' 
              ? 'Track and manage your support requests' 
              : 'Manage customer support tickets'}
          </p>
        </div>
        
        {user.role === 'user' && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>New Ticket</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="text-sm border border-gray-300 rounded-md px-3 py-1"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="triaged">Triaged</option>
            <option value="waiting_human">Waiting Human</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {user.role !== 'user' && (
            <select
              value={filters.myTickets}
              onChange={(e) => setFilters({ ...filters, myTickets: e.target.value })}
              className="text-sm border border-gray-300 rounded-md px-3 py-1"
            >
              <option value="">All Tickets</option>
              <option value="true">My Tickets</option>
            </select>
          )}

          <div className="text-sm text-gray-500">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="card">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No tickets found</p>
            {user.role === 'user' && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Create your first ticket</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Link 
                        to={`/tickets/${ticket._id}`}
                        className="text-lg font-medium text-gray-900 hover:text-blue-600"
                      >
                        {ticket.title}
                      </Link>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        <span className="capitalize">{ticket.status.replace('_', ' ')}</span>
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mt-2 line-clamp-2">
                      {ticket.description}
                    </p>
                    
                    <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Category:</span> {ticket.category}
                      </div>
                      {user.role !== 'user' && (
                        <div>
                          <span className="font-medium">Created by:</span> {ticket.createdBy?.name}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Created:</span> {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                      {ticket.assignee && (
                        <div>
                          <span className="font-medium">Assigned to:</span> {ticket.assignee.name}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {ticket.replies?.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {ticket.replies.length} replies
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          fetchTickets()
        }}
      />
    </div>
  )
}

export default Tickets

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { 
  Plus, 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  BookOpen 
} from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({})
  const [recentTickets, setRecentTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch tickets based on user role
      const ticketsParams = user.role === 'user' ? '?myTickets=true&limit=5' : '?limit=5'
      const [ticketsRes] = await Promise.all([
        api.get(`/tickets${ticketsParams}`)
      ])

      setRecentTickets(ticketsRes.data.tickets)
      
      // Calculate basic stats from tickets
      const allTicketsRes = await api.get('/tickets')
      const allTickets = allTicketsRes.data.tickets
      
      const statsData = {
        totalTickets: allTickets.length,
        openTickets: allTickets.filter(t => ['open', 'triaged', 'waiting_human'].includes(t.status)).length,
        resolvedTickets: allTickets.filter(t => t.status === 'resolved').length,
        myTickets: user.role === 'user' ? allTickets.filter(t => t.createdBy._id === user.id).length : allTickets.length
      }
      
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.name}
          </h1>
          <p className="text-gray-600">
            {user.role === 'user' 
              ? "Here's an overview of your support tickets" 
              : "Here's an overview of the helpdesk"}
          </p>
        </div>
        
        {user.role === 'user' && (
          <Link to="/tickets?action=create" className="btn-primary flex items-center space-x-2">
            <Plus size={16} />
            <span>New Ticket</span>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTickets || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Ticket className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.openTickets || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resolvedTickets || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {user.role === 'user' ? 'My Tickets' : 'All Tickets'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.myTickets || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
            <Link to="/tickets" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
        </div>
        
        {recentTickets.length === 0 ? (
          <div className="p-6 text-center">
            <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No tickets found</p>
            {user.role === 'user' && (
              <Link to="/tickets?action=create" className="btn-primary mt-4 inline-flex items-center space-x-2">
                <Plus size={16} />
                <span>Create your first ticket</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentTickets.map((ticket) => (
              <div key={ticket._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link 
                      to={`/tickets/${ticket._id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      {ticket.title}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-gray-500">
                        {user.role !== 'user' && `By ${ticket.createdBy?.name} • `}
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {ticket.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      <span className="capitalize">{ticket.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Quick Actions for Admins */}
      {['admin', 'agent'].includes(user.role) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Knowledge Base</h3>
                <p className="text-sm text-gray-500">Manage help articles</p>
              </div>
            </div>
            <Link 
              to="/kb" 
              className="mt-4 w-full btn-secondary text-center block"
            >
              Manage Articles
            </Link>
          </div>
          
          {user.role === 'admin' && (
            <div className="card p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">System Settings</h3>
                  <p className="text-sm text-gray-500">Configure AI thresholds</p>
                </div>
              </div>
              <Link 
                to="/settings" 
                className="mt-4 w-full btn-secondary text-center block"
              >
                Manage Settings
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Dashboard

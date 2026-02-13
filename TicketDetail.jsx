import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { 
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Bot,
  User,
  Calendar,
  Tag,
  MessageSquare
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const TicketDetail = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [suggestion, setSuggestion] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchTicketData()
  }, [id])

  const fetchTicketData = async () => {
    try {
      setLoading(true)
      const [ticketRes, auditRes] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/audit/tickets/${id}`)
      ])
      
      setTicket(ticketRes.data.ticket)
      setSuggestion(ticketRes.data.suggestion)
      setAuditLogs(auditRes.data.logs)
    } catch (error) {
      console.error('Error fetching ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return

    try {
      setSending(true)
      await api.post(`/tickets/${id}/reply`, {
        content: replyText,
        changeStatus: 'resolved'
      })
      
      setReplyText('')
      fetchTicketData() // Refresh data
    } catch (error) {
      console.error('Error sending reply:', error)
    } finally {
      setSending(false)
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

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Ticket not found</h2>
        <p className="text-gray-600 mt-2">The ticket you're looking for doesn't exist.</p>
        <Link to="/tickets" className="btn-primary mt-4 inline-flex items-center space-x-2">
          <ArrowLeft size={16} />
          <span>Back to Tickets</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link 
          to="/tickets" 
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          <span>Back to Tickets</span>
        </Link>
      </div>

      {/* Ticket Info */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {ticket.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar size={14} />
                <span>Created {formatDistanceToNow(new Date(ticket.createdAt))} ago</span>
              </div>
              <div className="flex items-center space-x-1">
                <Tag size={14} />
                <span className="capitalize">{ticket.category}</span>
              </div>
              <div className="flex items-center space-x-1">
                <User size={14} />
                <span>By {ticket.createdBy.name}</span>
              </div>
            </div>
          </div>
          
          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
            {getStatusIcon(ticket.status)}
            <span className="capitalize">{ticket.status.replace('_', ' ')}</span>
          </span>
        </div>

        <div className="prose max-w-none">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
        </div>
      </div>

      {/* AI Suggestion */}
      {suggestion && (
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Bot className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">AI Agent Suggestion</h2>
            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {Math.round(suggestion.confidence * 100)}% confidence
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-700">Predicted Category: </span>
              <span className="text-sm text-gray-900 capitalize">{suggestion.predictedCategory}</span>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Draft Reply:</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{suggestion.draftReply}</p>
              </div>
            </div>
            
            {suggestion.autoClosed && (
              <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                <CheckCircle size={16} />
                <span>This ticket was automatically resolved by the AI agent.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conversation */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Conversation</h2>
            <span className="text-sm text-gray-500">({ticket.replies?.length || 0} replies)</span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {ticket.replies?.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No replies yet
            </div>
          ) : (
            ticket.replies?.map((reply, index) => (
              <div key={index} className="p-6">
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    reply.isAgent ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {reply.isAgent ? (
                      reply.author ? <User size={16} className="text-blue-600" /> : <Bot size={16} className="text-blue-600" />
                    ) : (
                      <User size={16} className="text-gray-600" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {reply.author?.name || (reply.isAgent ? 'AI Agent' : 'User')}
                      </span>
                      {reply.isAgent && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {reply.author ? 'Agent' : 'AI'}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(reply.createdAt))} ago
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reply Form for Agents */}
        {['agent', 'admin'].includes(user.role) && !['resolved', 'closed'].includes(ticket.status) && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <form onSubmit={handleSendReply}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reply to customer
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Type your reply here..."
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="btn-primary"
                >
                  {sending ? 'Sending...' : 'Send Reply & Resolve'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Audit Timeline */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Activity Timeline</h2>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {auditLogs.map((log, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {log.action.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      by {log.actor}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(log.timestamp))} ago
                  </p>
                  {log.meta && Object.keys(log.meta).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-blue-600 cursor-pointer">Details</summary>
                      <pre className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.meta, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketDetail

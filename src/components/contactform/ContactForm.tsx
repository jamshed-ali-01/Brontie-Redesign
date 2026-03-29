'use client'
import { useState } from 'react'

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', cafe: '', description: '' })
  const [status, setStatus] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('Sending...')
    try {
      const res = await fetch('/api/contactus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('Message sent successfully!')
        setForm({ name: '', email: '', cafe: '', description: '' })
      } else {
        setStatus(data.message || 'Something went wrong.')
      }
    } catch {
      setStatus('Failed to send email')
    }
  }

  return (
    <div className="flex justify-center py-8 px-4">
      <div className="w-full max-w-xl border border-[#F3CB80] bg-white rounded-md shadow-lg p-6">
        <div className="text-center text-gray-800 mb-4">
          <h2 className="text-2xl font-semibold mb-1">Contact us here:</h2>
          <a href="mailto:hello@brontie.ie" className="text-blue-600 underline hover:text-blue-800">
            hello@brontie.ie
          </a>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F3CB80]"
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F3CB80]"
          />
          <input
            type="text"
            name="cafe"
            placeholder="Cafe Name"
            value={form.cafe}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F3CB80]"
          />
          <textarea
            name="description"
            placeholder="Describe your request..."
            value={form.description}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md h-20 resize-none text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F3CB80]"
          />
          <button
            type="submit"
            className="w-full bg-[#F3CB80] hover:bg-[#e6b864] text-black py-3 rounded-md font-semibold transition"
          >
            Send Message
          </button>

          {status && (
            <p className="text-center text-sm mt-2 text-red-500">
              {status}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Car, Package, Badge } from 'lucide-react';

interface CheckInFormData {
  visitorId: string;
  appointmentId: string;
  hasCar: boolean | null;
  plateNumber: string;
  hasOtherMaterial: boolean | null;
  materialDetails: string;
  additionalVisitors: string[];
  badgeNumber: string;
}

interface SecurityCheckInFormProps {
  appointmentId: string;
  visitorName: string;
  hostName: string;
  initialAdditionalVisitors?: any[];
  onSubmit: (data: CheckInFormData) => Promise<void>;
  onCancel: () => void;
}

export function SecurityCheckInForm({
  appointmentId,
  visitorName,
  hostName,
  initialAdditionalVisitors = [],
  onSubmit,
  onCancel,
}: SecurityCheckInFormProps) {
  const [formData, setFormData] = useState<CheckInFormData>({
    visitorId: '',
    appointmentId,
    hasCar: null,
    plateNumber: '',
    hasOtherMaterial: null,
    materialDetails: '',
    additionalVisitors: Array.isArray(initialAdditionalVisitors) 
      ? initialAdditionalVisitors.map(v => typeof v === 'string' ? v : (v?.name || 'Unknown'))
      : [],
    badgeNumber: '',
  });

  const [newVisitorName, setNewVisitorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.hasCar === null) {
      newErrors.hasCar = 'Please select if vehicle has a car';
    }
    if (formData.hasCar && !formData.plateNumber.trim()) {
      newErrors.plateNumber = 'Plate number is required when vehicle has a car';
    }
    if (formData.hasOtherMaterial === null) {
      newErrors.hasOtherMaterial = 'Please select if visitor has other materials';
    }
    if (formData.hasOtherMaterial && !formData.materialDetails.trim()) {
      newErrors.materialDetails = 'Please describe the materials';
    }

    if (!formData.badgeNumber.trim()) {
      newErrors.badgeNumber = 'Badge number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    let finalData = { ...formData };
    if (newVisitorName.trim()) {
      finalData.additionalVisitors = [...formData.additionalVisitors, newVisitorName.trim()];
    }

    setLoading(true);
    try {
      await onSubmit(finalData);
    } catch (error) {
      console.error('Check-in error:', error);
      setErrors({ submit: 'Failed to check in visitor. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const addVisitor = () => {
    if (newVisitorName.trim()) {
      setFormData(prev => ({
        ...prev,
        additionalVisitors: [...prev.additionalVisitors, newVisitorName.trim()]
      }));
      setNewVisitorName('');
    }
  };

  const removeVisitor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalVisitors: prev.additionalVisitors.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">Security Check-In</h2>
              <p className="text-cyan-100 text-sm">
                {visitorName} → {hostName}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Badge Number Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="text-cyan-600" size={20} />
              <label className="text-lg font-semibold text-gray-900">
                Badge Number <span className="text-red-500">*</span>
              </label>
            </div>
            <input
              type="text"
              placeholder="e.g., ENA-101"
              value={formData.badgeNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, badgeNumber: e.target.value.toUpperCase() }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
            />
            {errors.badgeNumber && <p className="text-red-500 text-sm">{errors.badgeNumber}</p>}
          </div>

          {/* Has Car Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Car className="text-cyan-600" size={20} />
              <label className="text-lg font-semibold text-gray-900">
                Has Car? <span className="text-red-500">*</span>
              </label>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, hasCar: true }))}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  formData.hasCar === true
                    ? 'bg-cyan-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, hasCar: false, plateNumber: '' }))}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  formData.hasCar === false
                    ? 'bg-cyan-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                No
              </button>
            </div>
            {errors.hasCar && <p className="text-red-500 text-sm">{errors.hasCar}</p>}
          </div>

          {/* Plate Number (conditional) */}
          {formData.hasCar && (
            <div className="space-y-3 bg-cyan-50 p-4 rounded-lg border border-cyan-200">
              <label className="text-lg font-semibold text-gray-900 block">
                Plate Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., AA-1234-ZZ"
                value={formData.plateNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, plateNumber: e.target.value.toUpperCase() }))}
                className="w-full px-4 py-3 border border-cyan-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white uppercase"
              />
              {errors.plateNumber && <p className="text-red-500 text-sm">{errors.plateNumber}</p>}
            </div>
          )}

          {/* Has Other Material Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="text-orange-600" size={20} />
              <label className="text-lg font-semibold text-gray-900">
                Has Other Material? <span className="text-red-500">*</span>
              </label>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, hasOtherMaterial: true }))}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  formData.hasOtherMaterial === true
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, hasOtherMaterial: false, materialDetails: '' }))}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  formData.hasOtherMaterial === false
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                No
              </button>
            </div>
            {errors.hasOtherMaterial && <p className="text-red-500 text-sm">{errors.hasOtherMaterial}</p>}
          </div>

          {/* Material Details (conditional) */}
          {formData.hasOtherMaterial && (
            <div className="space-y-3 bg-orange-50 p-4 rounded-lg border border-orange-200">
              <label className="text-lg font-semibold text-gray-900 block">
                Material Details <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Describe the materials being brought..."
                value={formData.materialDetails}
                onChange={(e) => setFormData(prev => ({ ...prev, materialDetails: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none bg-white"
              />
              {errors.materialDetails && <p className="text-red-500 text-sm">{errors.materialDetails}</p>}
            </div>
          )}

          {/* Additional Visitors Section */}
          <div className="space-y-4">
            <label className="text-lg font-semibold text-gray-900 block">
              Other Visitor Names (Optional)
            </label>
            <p className="text-gray-600 text-sm">
              Add additional visitor names that will accompany the main visitor
            </p>

            {/* List of Added Visitors */}
            {formData.additionalVisitors.length > 0 && (
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 space-y-2">
                {formData.additionalVisitors.map((visitor, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200"
                  >
                    <span className="text-gray-900 font-medium">{visitor}</span>
                    <button
                      type="button"
                      onClick={() => removeVisitor(index)}
                      className="text-red-500 hover:bg-red-50 p-1 rounded transition"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Visitor Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter visitor name"
                value={newVisitorName}
                onChange={(e) => setNewVisitorName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVisitor())}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addVisitor}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition"
              >
                <Plus size={18} />
                Add Another Visitor
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Checking In...' : 'Complete Check-In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Download, Trash2, RefreshCw, AlertCircle, Database, HardDrive, Server, Camera } from 'lucide-react';
import * as XLSX from 'xlsx';
import { fetchResources, deleteResource } from './api';
import type { AWSResource, ResourceTypeCount, AWSResourceType } from './types';

function App() {
  const [resources, setResources] = useState<AWSResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<AWSResourceType | 'ALL'>('ALL');

  const loadResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchResources();
      if (response.error) {
        setError(response.error);
        setResources([]);
      } else {
        setResources(response.resources || []);
      }
    } catch (err) {
      setError('Failed to fetch resources');
      setResources([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      const success = await deleteResource(id);
      if (success) {
        setResources(resources.filter(r => r.id !== id));
      } else {
        setError('Failed to delete resource');
      }
    }
  };

  const exportToExcel = () => {
    if (resources.length === 0) {
      setError('No resources available to export');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(resources);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AWS Resources');
    XLSX.writeFile(workbook, 'aws-resources.xlsx');
  };

  const getResourceIcon = (type: AWSResourceType) => {
    switch (type) {
      case 'EC2':
        return <Server className="h-4 w-4" />;
      case 'RDS':
        return <Database className="h-4 w-4" />;
      case 'EBS':
        return <HardDrive className="h-4 w-4" />;
      case 'SNAPSHOT':
        return <Camera className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getResourceStats = (): ResourceTypeCount[] => {
    return ['EC2', 'RDS', 'EBS', 'SNAPSHOT'].map(type => ({
      type: type as AWSResourceType,
      count: resources.filter(r => r.type === type).length,
      totalCost: resources
        .filter(r => r.type === type)
        .reduce((sum, r) => sum + r.cost, 0)
    }));
  };

  const filteredResources = selectedType === 'ALL' 
    ? resources 
    : resources.filter(r => r.type === selectedType);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AWS Cloud Waste Management</h1>
          <div className="flex gap-4">
            <button
              onClick={loadResources}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={exportToExcel}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              disabled={resources.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Resource Type Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {getResourceStats().map(stat => (
            <div
              key={stat.type}
              onClick={() => setSelectedType(stat.type)}
              className={`bg-white p-4 rounded-lg shadow cursor-pointer transform transition-transform hover:scale-105 ${
                selectedType === stat.type ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getResourceIcon(stat.type)}
                  <span className="ml-2 font-medium">{stat.type}</span>
                </div>
                <span className="text-2xl font-bold">{stat.count}</span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Total Cost: ${stat.totalCost.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Filter Controls */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setSelectedType('ALL')}
            className={`px-3 py-1 rounded ${
              selectedType === 'ALL' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          {['EC2', 'RDS', 'EBS', 'SNAPSHOT'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type as AWSResourceType)}
              className={`px-3 py-1 rounded flex items-center ${
                selectedType === type 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {getResourceIcon(type as AWSResourceType)}
              <span className="ml-1">{type}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="ml-3 text-red-700">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center text-gray-500">
            No resources found
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Used</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResources.map((resource) => (
                  <tr key={resource.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        {getResourceIcon(resource.type)}
                        <span className="ml-2">{resource.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{resource.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {resource.type === 'EC2' && resource.details.instanceType && (
                        <span>Instance: {resource.details.instanceType}</span>
                      )}
                      {resource.type === 'RDS' && (
                        <span>
                          {resource.details.engine} ({resource.details.instanceType})
                        </span>
                      )}
                      {resource.type === 'EBS' && (
                        <span>
                          {resource.details.volumeSize}GB ({resource.details.volumeType})
                        </span>
                      )}
                      {resource.type === 'SNAPSHOT' && (
                        <span>{resource.details.snapshotSize}GB</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{resource.region}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        resource.state === 'stopped' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {resource.state}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{resource.lastUsed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${resource.cost.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
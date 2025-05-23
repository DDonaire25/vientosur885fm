import React, { useState } from 'react';
import { ArrowLeft, Camera } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

interface EditProfileFormProps {
  onCancel: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ onCancel }) => {
  const { user } = useAuthStore();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState('Creative artist and designer passionate about digital art and modern aesthetics.');
  const [website, setWebsite] = useState('https://example.com');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim() || !username.trim()) {
      toast.error('Display name and username are required');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, this would update the user profile through an API
    toast.success('Profile updated successfully!');
    setIsSubmitting(false);
    onCancel();
  };
  
  return (
    <div className="animate-fade-in">
      {/* Form Header */}
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
        <h2 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">
          Edit Profile
        </h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="avatar h-24 w-24">
              <img 
                src={avatar} 
                alt={displayName} 
                className="avatar-img"
              />
            </div>
            <button
              type="button"
              className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Display Name */}
        <div className="mb-4">
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Display Name*
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input"
            required
          />
        </div>
        
        {/* Username */}
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Username*
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              @
            </span>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input rounded-l-none flex-1"
              required
            />
          </div>
        </div>
        
        {/* Bio */}
        <div className="mb-4">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="input min-h-[100px]"
            placeholder="Tell us about yourself"
          />
        </div>
        
        {/* Website */}
        <div className="mb-4">
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Website
          </label>
          <input
            id="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="input"
            placeholder="https://example.com"
          />
        </div>
        
        {/* Submit */}
        <div className="flex justify-end space-x-2 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !displayName.trim() || !username.trim()}
            className="btn btn-primary px-4 py-2"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfileForm;
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { organizationService } from "@/lib/services/organization-service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Loader2, ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { DatePicker } from "@/components/ui/date-picker";
import { TagSelector } from "@/components/ui/search-tag-selector";
import { industryOptions } from "@/lib/constants";

export default function EditOrganizationPage({
  params,
}: {
  params: { id: string };
}) {
  const organizationId = params.id;
  const { authUser: user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedFoundedDate, setSelectedFoundedDate] = useState<Date | undefined>(undefined);
  const [selectedJoinedDate, setSelectedJoinedDate] = useState<Date | undefined>(undefined);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website_url: "",
    founded_date: "",
    joined_aggiex_date: "",
  });

  // Image upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [generalImages, setGeneralImages] = useState<File[]>([]);
  const [generalImagePreviews, setGeneralImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{ id: string; url: string; position: number }>>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  // Fetch organization data
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        if (!organizationId) {
          setNotFound(true);
          return;
        }

        // Check authorization first
        if (!user) {
          setNotAuthorized(true);
          return;
        }

        const authResponse = await fetch(`/api/organizations/${organizationId}/can-edit`);
        if (!authResponse.ok) {
          setNotAuthorized(true);
          return;
        }
        
        const authData = await authResponse.json();
        if (!authData.canEdit) {
          setNotAuthorized(true);
          return;
        }

        // Fetch organization data
        const orgData = await organizationService.getOrganization(organizationId);

        if (!orgData) {
          setNotFound(true);
          return;
        }

        // Initialize image data from API response
        setExistingLogoUrl(orgData.logo_url || null);
        
        // Use imageRecords if available (from API), otherwise fall back to images array
        if (orgData.imageRecords && Array.isArray(orgData.imageRecords)) {
          setExistingImages(orgData.imageRecords);
        } else if (orgData.images && Array.isArray(orgData.images)) {
          // Fallback: if we only have URLs, create minimal records
          const imageRecords = orgData.images.map((url: string, index: number) => ({
            id: `temp-${index}`,
            url,
            position: index
          }));
          setExistingImages(imageRecords);
        }

        // Initialize form data
        setFormData({
          name: orgData.name || "",
          description: orgData.description || "",
          website_url: orgData.website_url || "",
          founded_date: orgData.founded_date || "",
          joined_aggiex_date: orgData.joined_aggiex_date || "",
        });

        setSelectedIndustries(orgData.industry || []);

        // Initialize date pickers
        if (orgData.founded_date) {
          setSelectedFoundedDate(new Date(orgData.founded_date));
        }
        if (orgData.joined_aggiex_date) {
          setSelectedJoinedDate(new Date(orgData.joined_aggiex_date));
        }
      } catch (err) {
        console.error("Error fetching organization:", err);
        setError("Failed to load organization data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchOrganization();
    }
  }, [organizationId, user, authLoading]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Logo handling
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo file size must be less than 5MB");
      return;
    }

    setLogoFile(file);
    const preview = URL.createObjectURL(file);
    setLogoPreview(preview);
  };

  // General images handling
  const handleGeneralImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024);
    
    if (validFiles.length !== files.length) {
      toast.error("Some images exceed 5MB limit");
    }

    const remainingSlots = 5 - (existingImages.length - imagesToDelete.length);
    const filesToAdd = validFiles.slice(0, remainingSlots);
    
    setGeneralImages((prev) => [...prev, ...filesToAdd]);
    const previews = filesToAdd.map((file) => URL.createObjectURL(file));
    setGeneralImagePreviews((prev) => [...prev, ...previews]);
  };

  const removeGeneralImage = (index: number) => {
    const preview = generalImagePreviews[index];
    URL.revokeObjectURL(preview);
    setGeneralImages((prev) => prev.filter((_, i) => i !== index));
    setGeneralImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: string, imageUrl: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    setImagesToDelete((prev) => [...prev, imageUrl]);
  };

  const clearLogo = () => {
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoFile(null);
    setLogoPreview(null);
    setExistingLogoUrl(null);
    const input = document.getElementById("logo-input") as HTMLInputElement;
    if (input) input.value = "";
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      generalImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [logoPreview, generalImagePreviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to update this organization");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Validate form data
      if (!formData.name.trim()) {
        setError("Organization name is required");
        return;
      }

      if (!formData.description.trim()) {
        setError("Organization description is required");
        return;
      }

      // Handle logo upload/update
      let logoUrl: string | null = existingLogoUrl;
      if (logoFile) {
        if (existingLogoUrl) {
          try {
            await organizationService.deleteLogo(existingLogoUrl);
          } catch (err) {
            console.error("Error deleting old logo:", err);
          }
        }
        logoUrl = await organizationService.uploadLogo(logoFile);
      } else if (!existingLogoUrl) {
        logoUrl = null;
      }

      // Delete images that were marked for deletion
      for (const imageUrl of imagesToDelete) {
        try {
          await organizationService.deleteImage(imageUrl);
          // Delete from database via API
          await fetch(`/api/organizations/${organizationId}/images`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: imageUrl }),
          });
        } catch (err) {
          console.error("Error deleting image:", err);
        }
      }

      // Upload new general images
      const generalImageUrls: string[] = [];
      for (const imageFile of generalImages) {
        const imageUrl = await organizationService.uploadImage(imageFile);
        generalImageUrls.push(imageUrl);
      }

      // Update form data
      const organizationData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        website_url: formData.website_url.trim() || null,
        logo_url: logoUrl,
        industry: selectedIndustries,
        founded_date: selectedFoundedDate ? selectedFoundedDate.toISOString() : null,
        joined_aggiex_date: selectedJoinedDate ? selectedJoinedDate.toISOString() : null,
      };

      await organizationService.updateOrganization(organizationId, organizationData);

      // Save new general images to organization_images table
      if (generalImageUrls.length > 0) {
        const maxPosition = existingImages.length > 0 
          ? Math.max(...existingImages.map(img => img.position))
          : -1;
        
        const imageRecords = generalImageUrls.map((url, index) => ({
          url,
          position: maxPosition + index + 1
        }));
        
        try {
          const response = await fetch(`/api/organizations/${organizationId}/images`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ images: imageRecords }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to save images');
          }
        } catch (imageSaveError) {
          console.error("Error saving organization images:", imageSaveError);
          toast.warning("Organization updated but some images may not have been saved");
        }
      }

      toast.success("Organization updated successfully!");
      router.push(`/users/organizations/${organizationId}`);
    } catch (err: unknown) {
      console.error("Error updating organization:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update organization. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/users");
    }
  };

  // Display loading state
  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Handle not found
  if (notFound) {
    return (
      <div className="container py-8">
        <Alert className="mb-6">
          <AlertDescription>
            Organization not found. The organization may have been deleted or you don&apos;t have access to it.
            <Link href="/users" className="ml-2 underline">
              Browse organizations
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Handle not authorized
  if (notAuthorized) {
    return (
      <div className="container py-8">
        <Alert className="mb-6">
          <AlertDescription>
            You don&apos;t have permission to edit this organization. Only admins and organization managers can edit it.
            <Link href={`/users/organizations/${organizationId}`} className="ml-2 underline">
              View organization
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Handle not logged in
  if (!user) {
    return (
      <div className="container py-8">
        <Alert className="mb-6">
          <AlertDescription>
            You need to be logged in to edit an organization.
            <Link href="/auth/login" className="ml-2 underline">
              Log in
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={handleBack}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-center">Edit Organization</h1>
        <p className="text-muted-foreground mt-1 text-center">
          Update organization details
        </p>
        <hr className="mt-8"></hr>
      </div>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <CardHeader className="md:col-span-1 p-0">
              <CardTitle>Images & Logo</CardTitle>
              <CardDescription>
                Upload a logo and showcase images for your organization
              </CardDescription>
            </CardHeader>

            <div className="md:col-span-2 space-y-4">
              {/* Logo Upload Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="logo-input">Organization Logo</Label>
                  <span className="text-xs text-muted-foreground">(optional)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="logo-input"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="h-10 flex-1"
                  />
                  {(logoPreview || existingLogoUrl) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearLogo}
                      className="h-10"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG (max 5MB)
                </p>
                {(logoPreview || existingLogoUrl) && (
                  <div className="mt-2">
                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                      <Image
                        src={logoPreview || existingLogoUrl || ""}
                        alt="Logo preview"
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Organization Images Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="general-images-input">Organization Images</Label>
                  <span className="text-xs text-muted-foreground">(optional)</span>
                </div>
                <Input
                  id="general-images-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGeneralImagesChange}
                  disabled={(generalImages.length + existingImages.length - imagesToDelete.length) >= 5}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  JPG, PNG (max 5MB each, up to 5 images total)
                </p>
                
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="relative w-full aspect-video border rounded-lg overflow-hidden">
                          <Image
                            src={image.url}
                            alt={`Organization image ${image.position + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeExistingImage(image.id, image.url)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Image Previews */}
                {generalImagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {generalImagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="relative w-full aspect-video border rounded-lg overflow-hidden">
                          <Image
                            src={preview}
                            alt={`New organization image ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeGeneralImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <hr className="pt-6"></hr>

        <Card className="mb-6">
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <CardHeader className="md:col-span-1 p-0">
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the core details about your organization
              </CardDescription>
            </CardHeader>

            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter organization name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your organization, its mission, and what it does"
                  className="min-h-[120px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  name="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <TagSelector
                  label="Industries"
                  options={industryOptions}
                  selected={selectedIndustries}
                  onChange={setSelectedIndustries}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <hr className="pt-6"></hr>

        <Card className="mb-6">
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <CardHeader className="md:col-span-1 p-0">
              <CardTitle>Additional Details</CardTitle>
              <CardDescription>
                Provide additional information about your organization
              </CardDescription>
            </CardHeader>

            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <Label>Founded Date</Label>
                <DatePicker
                  selected={selectedFoundedDate}
                  onSelect={setSelectedFoundedDate}
                />
              </div>

              <div className="space-y-2">
                <Label>Joined AggieX Date</Label>
                <DatePicker
                  selected={selectedJoinedDate}
                  onSelect={setSelectedJoinedDate}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}


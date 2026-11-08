import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a texture asset to Supabase Storage bucket (default bucket: 'textures')
 */
export async function uploadTextureAsset(
  file: File,
  bucket = "textures",
  path?: string,
): Promise<string> {
  const filePath = path || `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload texture: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrlData.publicUrl;
}

/**
 * Get public URL for a texture asset stored in Supabase Storage
 */
export function getTextureAssetUrl(path: string, bucket = "textures"): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * List texture assets in a Supabase Storage bucket/folder
 */
export async function listTextureAssets(
  bucket = "textures",
  folder = "",
): Promise<{ name: string; url: string }[]> {
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 100,
    offset: 0,
  });

  if (error) {
    console.error("Error listing texture assets:", error.message);
    return [];
  }

  return (data || []).map((file) => {
    const filePath = folder ? `${folder}/${file.name}` : file.name;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return {
      name: file.name,
      url: urlData.publicUrl,
    };
  });
}

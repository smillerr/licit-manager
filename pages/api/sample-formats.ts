import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const { data: formats, error } = await supabase
        .from("sample_formats")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Database error:", error);
        // If table doesn't exist, return empty array
        if (
          error.code === "PGRST116" ||
          error.message?.includes('relation "sample_formats" does not exist')
        ) {
          return res.status(200).json({ formats: [] });
        }
        throw error;
      }

      return res.status(200).json({ formats: formats || [] });
    } catch (error) {
      console.error("Error fetching sample formats:", error);
      return res.status(500).json({ error: "Failed to fetch sample formats" });
    }
  }

  if (req.method === "POST") {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session?.user || (session.user as any).role !== "admin") {
        return res
          .status(403)
          .json({ error: "Unauthorized - Admin access required" });
      }

      const form = formidable({
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        filter: (part) => part.mimetype === "application/pdf",
      });

      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error("Form parsing error:", err);
          return res.status(400).json({ error: "Failed to parse form data" });
        }

        const file = files.file?.[0];
        if (!file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
        const description = Array.isArray(fields.description)
          ? fields.description[0]
          : fields.description;

        if (!name) {
          return res.status(400).json({ error: "Name is required" });
        }

        try {
          // Read file content
          const fileContent = fs.readFileSync(file.filepath);

          // Generate unique filename
          const fileExt = path.extname(file.originalFilename || "file.pdf");
          const fileName = `sample-formats/${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}${fileExt}`;

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("licitaciones")
              .upload(fileName, fileContent, {
                contentType: "application/pdf",
                upsert: false,
              });

          if (uploadError) {
            console.error("Storage upload error:", uploadError);
            return res
              .status(500)
              .json({ error: "Failed to upload file to storage" });
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from("licitaciones")
            .getPublicUrl(fileName);

          // Save to database
          const { data, error } = await supabase
            .from("sample_formats")
            .insert({
              name,
              description: description || null,
              file_url: urlData.publicUrl,
              file_size: file.size,
              uploaded_by: (session.user as any).id,
            })
            .select()
            .single();

          if (error) {
            // Clean up storage file if database insert fails
            await supabase.storage.from("licitaciones").remove([fileName]);
            console.error("Database error:", error);
            return res
              .status(500)
              .json({ error: "Failed to save format to database" });
          }

          // Clean up temp file
          fs.unlinkSync(file.filepath);

          return res.status(200).json({
            message: "Sample format uploaded successfully",
            format: data,
          });
        } catch (error) {
          console.error("Upload processing error:", error);
          // Clean up temp file
          if (file.filepath && fs.existsSync(file.filepath)) {
            fs.unlinkSync(file.filepath);
          }
          return res.status(500).json({ error: "Failed to process upload" });
        }
      });
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session?.user || (session.user as any).role !== "admin") {
        return res
          .status(403)
          .json({ error: "Unauthorized - Admin access required" });
      }

      const { id } = req.query;

      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Format ID is required" });
      }

      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from("sample_formats")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      return res.status(200).json({
        message: "Sample format deactivated successfully",
      });
    } catch (error) {
      console.error("Delete error:", error);
      return res.status(500).json({ error: "Failed to deactivate format" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

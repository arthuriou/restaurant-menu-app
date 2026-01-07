import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Missing Cloudinary Env Vars:", { 
          hasCloudName: !!cloudName, 
          hasApiKey: !!apiKey, 
          hasApiSecret: !!apiSecret 
      });
      return NextResponse.json(
        { error: "Cloudinary credentials missing. Please check .env file." },
        { status: 500 }
      );
    }

    // Use standard Admin API List Resources
    // We remove the prefix restriction for now to safeguard against empty folder issues.
    // It will list the most recent images uploaded to the cloud.
    const queryString = `max_results=100&direction=desc`;
    
    // We use the basic auth method for Cloudinary API
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    
    console.log(`[CLOUDINARY_DEBUG] Fetching from: https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?${queryString}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?${queryString}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    const data = await response.json();
    
    console.log(`[CLOUDINARY_DEBUG] Response Status: ${response.status}`);
    if(data.resources) {
        console.log(`[CLOUDINARY_DEBUG] Found ${data.resources.length} images.`);
    } else {
        console.log(`[CLOUDINARY_DEBUG] No resources found or error:`, data);
    }

    if (data.error) {
      throw new Error(data.error.message);
    }

    const images = data.resources.map((res: any) => ({
      id: res.asset_id,
      url: res.secure_url,
      fileName: res.filename,
      format: res.format,
      createdAt: res.created_at,
      width: res.width,
      height: res.height,
      publicId: res.public_id
    }));

    return NextResponse.json({ images });
  } catch (error: any) {
    console.error("[CLOUDINARY_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

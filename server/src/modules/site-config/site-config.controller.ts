import { Request, Response } from 'express';
import { prisma } from '../../core/database/prisma.js';
import { sendSuccess, sendError } from '../../core/utils/response.js';

export async function getSiteConfig(_req: Request, res: Response) {
  try {
    let config = await prisma.siteConfig.findFirst();
    if (!config) {
      config = await prisma.siteConfig.create({ data: {} });
    }
    return sendSuccess(res, config);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function updateSiteConfig(req: Request, res: Response) {
  try {
    const { siteName, tagline, heroTitle, heroSubtitle, heroImage, aboutText, contactEmail, contactPhone, socialIg, socialFb, socialTw } = req.body;

    let config = await prisma.siteConfig.findFirst();
    if (!config) {
      config = await prisma.siteConfig.create({
        data: {
          siteName: siteName || 'Optic Luxe',
          tagline, heroTitle, heroSubtitle, heroImage, aboutText,
          contactEmail, contactPhone, socialIg, socialFb, socialTw,
        },
      });
    } else {
      config = await prisma.siteConfig.update({
        where: { id: config.id },
        data: {
          ...(siteName !== undefined && { siteName }),
          ...(tagline !== undefined && { tagline }),
          ...(heroTitle !== undefined && { heroTitle }),
          ...(heroSubtitle !== undefined && { heroSubtitle }),
          ...(heroImage !== undefined && { heroImage }),
          ...(aboutText !== undefined && { aboutText }),
          ...(contactEmail !== undefined && { contactEmail }),
          ...(contactPhone !== undefined && { contactPhone }),
          ...(socialIg !== undefined && { socialIg }),
          ...(socialFb !== undefined && { socialFb }),
          ...(socialTw !== undefined && { socialTw }),
        },
      });
    }

    return sendSuccess(res, config, 'Settings updated');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

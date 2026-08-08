// ============================================================
// EXTERNAL SERVICES INDEX
// Central export point for all external service modules
// ============================================================

// Mapbox service
export { default as mapboxService } from "./mapbox.service";
export type {
  GeocodeResult,
  ReverseGeocodeResult,
  PlaceSearchResult,
  DistanceResult,
  AutocompleteResult,
} from "./mapbox.service";

// Twilio service
export { default as twilioService } from "./twilio.service";
export type {
  SMSSendData,
  SMSResponse,
  BulkSMSData,
  VerificationResult,
  PhoneNumberValidationResult,
} from "./twilio.service";

// SendGrid service
export { default as sendgridService } from "./sendgrid.service";
export type {
  EmailSendData,
  EmailAttachment,
  EmailResponse,
  BulkEmailData,
  EmailValidationResult,
} from "./sendgrid.service";

// Cloudinary service
export { default as cloudinaryService } from "./cloudinary.service";
export type {
  UploadOptions,
  UploadResult,
  DeleteResult,
  TransformOptions,
  ImageInfo,
} from "./cloudinary.service";

// ============================================================
// RE-EXPORT ALL EXTERNAL SERVICES AS A SINGLE OBJECT
// ============================================================

import mapboxService from "./mapbox.service";
import twilioService from "./twilio.service";
import sendgridService from "./sendgrid.service";
import cloudinaryService from "./cloudinary.service";

export const externalServices = {
  mapbox: mapboxService,
  twilio: twilioService,
  sendgrid: sendgridService,
  cloudinary: cloudinaryService,
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default externalServices;

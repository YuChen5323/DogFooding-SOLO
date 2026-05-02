use wasm_bindgen::prelude::*;
use web_sys::ImageData;

#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

fn clamp(value: f32, min: f32, max: f32) -> f32 {
    value.max(min).min(max)
}

fn clamp_u8(value: i32) -> u8 {
    if value < 0 {
        0
    } else if value > 255 {
        255
    } else {
        value as u8
    }
}

#[wasm_bindgen]
pub fn adjust_brightness(image_data: &ImageData, brightness: f32) -> ImageData {
    let mut data = image_data.data().to_vec();
    let delta = brightness * 255.0;

    for pixel in data.chunks_exact_mut(4) {
        pixel[0] = clamp_u8(pixel[0] as i32 + delta as i32);
        pixel[1] = clamp_u8(pixel[1] as i32 + delta as i32);
        pixel[2] = clamp_u8(pixel[2] as i32 + delta as i32);
    }

    ImageData::new_with_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(&mut data),
        image_data.width(),
        image_data.height(),
    )
    .unwrap()
}

#[wasm_bindgen]
pub fn adjust_contrast(image_data: &ImageData, contrast: f32) -> ImageData {
    let mut data = image_data.data().to_vec();
    let factor = (259.0 * (contrast * 255.0 + 255.0)) / (255.0 * (259.0 - contrast * 255.0));

    for pixel in data.chunks_exact_mut(4) {
        for channel in 0..3 {
            pixel[channel] = clamp_u8((factor * (pixel[channel] as f32 - 128.0) + 128.0) as i32);
        }
    }

    ImageData::new_with_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(&mut data),
        image_data.width(),
        image_data.height(),
    )
    .unwrap()
}

#[wasm_bindgen]
pub fn adjust_saturation(image_data: &ImageData, saturation: f32) -> ImageData {
    let mut data = image_data.data().to_vec();

    for pixel in data.chunks_exact_mut(4) {
        let r = pixel[0] as f32 / 255.0;
        let g = pixel[1] as f32 / 255.0;
        let b = pixel[2] as f32 / 255.0;

        let gray = 0.299 * r + 0.587 * g + 0.114 * b;

        pixel[0] = clamp_u8(((gray + saturation * (r - gray)) * 255.0) as i32);
        pixel[1] = clamp_u8(((gray + saturation * (g - gray)) * 255.0) as i32);
        pixel[2] = clamp_u8(((gray + saturation * (b - gray)) * 255.0) as i32);
    }

    ImageData::new_with_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(&mut data),
        image_data.width(),
        image_data.height(),
    )
    .unwrap()
}

#[wasm_bindgen]
pub fn adjust_hue(image_data: &ImageData, hue_degrees: f32) -> ImageData {
    let mut data = image_data.data().to_vec();
    let hue_radians = hue_degrees.to_radians();
    let cos_val = hue_radians.cos();
    let sin_val = hue_radians.sin();

    for pixel in data.chunks_exact_mut(4) {
        let r = pixel[0] as f32;
        let g = pixel[1] as f32;
        let b = pixel[2] as f32;

        let new_r = (0.213 + cos_val * 0.787 - sin_val * 0.213) * r
            + (0.715 - cos_val * 0.715 - sin_val * 0.715) * g
            + (0.072 - cos_val * 0.072 + sin_val * 0.928) * b;
        let new_g = (0.213 - cos_val * 0.213 + sin_val * 0.143) * r
            + (0.715 + cos_val * 0.285 + sin_val * 0.140) * g
            + (0.072 - cos_val * 0.072 - sin_val * 0.283) * b;
        let new_b = (0.213 - cos_val * 0.213 - sin_val * 0.787) * r
            + (0.715 - cos_val * 0.715 + sin_val * 0.715) * g
            + (0.072 + cos_val * 0.928 + sin_val * 0.072) * b;

        pixel[0] = clamp_u8(new_r as i32);
        pixel[1] = clamp_u8(new_g as i32);
        pixel[2] = clamp_u8(new_b as i32);
    }

    ImageData::new_with_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(&mut data),
        image_data.width(),
        image_data.height(),
    )
    .unwrap()
}

#[wasm_bindgen]
pub fn filter_grayscale(image_data: &ImageData) -> ImageData {
    let mut data = image_data.data().to_vec();

    for pixel in data.chunks_exact_mut(4) {
        let gray = (0.299 * pixel[0] as f32 + 0.587 * pixel[1] as f32 + 0.114 * pixel[2] as f32) as u8;
        pixel[0] = gray;
        pixel[1] = gray;
        pixel[2] = gray;
    }

    ImageData::new_with_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(&mut data),
        image_data.width(),
        image_data.height(),
    )
    .unwrap()
}

#[wasm_bindgen]
pub fn filter_invert(image_data: &ImageData) -> ImageData {
    let mut data = image_data.data().to_vec();

    for pixel in data.chunks_exact_mut(4) {
        pixel[0] = 255 - pixel[0];
        pixel[1] = 255 - pixel[1];
        pixel[2] = 255 - pixel[2];
    }

    ImageData::new_with_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(&mut data),
        image_data.width(),
        image_data.height(),
    )
    .unwrap()
}

#[wasm_bindgen]
pub fn filter_sepia(image_data: &ImageData) -> ImageData {
    let mut data = image_data.data().to_vec();

    for pixel in data.chunks_exact_mut(4) {
        let r = pixel[0] as f32;
        let g = pixel[1] as f32;
        let b = pixel[2] as f32;

        let tr = 0.393 * r + 0.769 * g + 0.189 * b;
        let tg = 0.349 * r + 0.686 * g + 0.168 * b;
        let tb = 0.272 * r + 0.534 * g + 0.131 * b;

        pixel[0] = clamp_u8(tr as i32);
        pixel[1] = clamp_u8(tg as i32);
        pixel[2] = clamp_u8(tb as i32);
    }

    ImageData::new_with_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(&mut data),
        image_data.width(),
        image_data.height(),
    )
    .unwrap()
}

#[wasm_bindgen]
pub fn filter_gaussian_blur(image_data: &ImageData, radius: f32) -> ImageData {
    let width = image_data.width() as usize;
    let height = image_data.height() as usize;
    let mut src = image_data.data().to_vec();
    let mut dst = src.clone();

    let r = radius.max(0.5) as usize;
    let sigma = radius / 3.0;
    let kernel_size = 2 * r + 1;
    let mut kernel = vec![0.0; kernel_size];
    let mut sum = 0.0;

    for i in 0..kernel_size {
        let x = (i as f32 - r as f32) / sigma;
        kernel[i] = (-0.5 * x * x).exp();
        sum += kernel[i];
    }

    for i in 0..kernel_size {
        kernel[i] /= sum;
    }

    for y in 0..height {
        for x in 0..width {
            let mut sums = [0.0; 3];
            for k in 0..kernel_size {
                let px = (x as i32 + k as i32 - r as i32).clamp(0, width as i32 - 1) as usize;
                let idx = (y * width + px) * 4;
                for c in 0..3 {
                    sums[c] += src[idx + c] as f32 * kernel[k];
                }
            }
            let idx = (y * width + x) * 4;
            for c in 0..3 {
                dst[idx + c] = sums[c] as u8;
            }
        }
    }

    src.copy_from_slice(&dst);

    for y in 0..height {
        for x in 0..width {
            let mut sums = [0.0; 3];
            for k in 0..kernel_size {
                let py = (y as i32 + k as i32 - r as i32).clamp(0, height as i32 - 1) as usize;
                let idx = (py * width + x) * 4;
                for c in 0..3 {
                    sums[c] += src[idx + c] as f32 * kernel[k];
                }
            }
            let idx = (y * width + x) * 4;
            for c in 0..3 {
                dst[idx + c] = sums[c] as u8;
            }
        }
    }

    ImageData::new_with_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(&mut dst),
        image_data.width(),
        image_data.height(),
    )
    .unwrap()
}

#[wasm_bindgen]
pub fn filter_sharpen(image_data: &ImageData, intensity: f32) -> ImageData {
    let width = image_data.width() as usize;
    let height = image_data.height() as usize;
    let src = image_data.data().to_vec();
    let mut dst = src.clone();

    let center = 5.0 * intensity;
    let edge = -1.0 * intensity;

    for y in 1..height - 1 {
        for x in 1..width - 1 {
            for c in 0..3 {
                let idx = (y * width + x) * 4 + c;
                let val = src[idx] as f32 * center
                    + src[idx - 4] as f32 * edge
                    + src[idx + 4] as f32 * edge
                    + src[idx - width * 4] as f32 * edge
                    + src[idx + width * 4] as f32 * edge;
                dst[idx] = clamp_u8(val as i32);
            }
        }
    }

    ImageData::new_with_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(&mut dst),
        image_data.width(),
        image_data.height(),
    )
    .unwrap()
}

#[wasm_bindgen]
pub fn blend_normal(
    base_data: &ImageData,
    overlay_data: &ImageData,
    opacity: f32,
) -> ImageData {
    let width = base_data.width();
    let height = base_data.height();
    let base = base_data.data().to_vec();
    let overlay = overlay_data.data().to_vec();
    let mut result = base.clone();

    for i in (0..result.len()).step_by(4) {
        let base_alpha = base[i + 3] as f32 / 255.0;
        let overlay_alpha = (overlay[i + 3] as f32 / 255.0) * opacity;
        
        if overlay_alpha > 0.0 {
            for c in 0..3 {
                let base_c = base[i + c] as f32 / 255.0;
                let overlay_c = overlay[i + c] as f32 / 255.0;
                
                let out_c = overlay_c * overlay_alpha + base_c * (1.0 - overlay_alpha);
                result[i + c] = (out_c * 255.0) as u8;
            }
            
            let out_alpha = overlay_alpha + base_alpha * (1.0 - overlay_alpha);
            result[i + 3] = (out_alpha * 255.0) as u8;
        }
    }

    ImageData::new_with_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(&mut result),
        width,
        height,
    )
    .unwrap()
}

#[wasm_bindgen]
pub fn blend_multiply(
    base_data: &ImageData,
    overlay_data: &ImageData,
    opacity: f32,
) -> ImageData {
    let width = base_data.width();
    let height = base_data.height();
    let base = base_data.data().to_vec();
    let overlay = overlay_data.data().to_vec();
    let mut result = base.clone();

    for i in (0..result.len()).step_by(4) {
        let base_alpha = base[i + 3] as f32 / 255.0;
        let overlay_alpha = (overlay[i + 3] as f32 / 255.0) * opacity;
        
        if overlay_alpha > 0.0 {
            for c in 0..3 {
                let base_c = base[i + c] as f32 / 255.0;
                let overlay_c = overlay[i + c] as f32 / 255.0;
                
                let blend_c = base_c * overlay_c;
                let out_c = blend_c * overlay_alpha + base_c * (1.0 - overlay_alpha);
                result[i + c] = (out_c * 255.0) as u8;
            }
            
            let out_alpha = overlay_alpha + base_alpha * (1.0 - overlay_alpha);
            result[i + 3] = (out_alpha * 255.0) as u8;
        }
    }

    ImageData::new_with_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(&mut result),
        width,
        height,
    )
    .unwrap()
}

#[wasm_bindgen]
pub fn blend_screen(
    base_data: &ImageData,
    overlay_data: &ImageData,
    opacity: f32,
) -> ImageData {
    let width = base_data.width();
    let height = base_data.height();
    let base = base_data.data().to_vec();
    let overlay = overlay_data.data().to_vec();
    let mut result = base.clone();

    for i in (0..result.len()).step_by(4) {
        let base_alpha = base[i + 3] as f32 / 255.0;
        let overlay_alpha = (overlay[i + 3] as f32 / 255.0) * opacity;
        
        if overlay_alpha > 0.0 {
            for c in 0..3 {
                let base_c = base[i + c] as f32 / 255.0;
                let overlay_c = overlay[i + c] as f32 / 255.0;
                
                let blend_c = 1.0 - (1.0 - base_c) * (1.0 - overlay_c);
                let out_c = blend_c * overlay_alpha + base_c * (1.0 - overlay_alpha);
                result[i + c] = (out_c * 255.0) as u8;
            }
            
            let out_alpha = overlay_alpha + base_alpha * (1.0 - overlay_alpha);
            result[i + 3] = (out_alpha * 255.0) as u8;
        }
    }

    ImageData::new_with_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(&mut result),
        width,
        height,
    )
    .unwrap()
}

#[wasm_bindgen]
pub fn blend_overlay(
    base_data: &ImageData,
    overlay_data: &ImageData,
    opacity: f32,
) -> ImageData {
    let width = base_data.width();
    let height = base_data.height();
    let base = base_data.data().to_vec();
    let overlay = overlay_data.data().to_vec();
    let mut result = base.clone();

    for i in (0..result.len()).step_by(4) {
        let base_alpha = base[i + 3] as f32 / 255.0;
        let overlay_alpha = (overlay[i + 3] as f32 / 255.0) * opacity;
        
        if overlay_alpha > 0.0 {
            for c in 0..3 {
                let base_c = base[i + c] as f32 / 255.0;
                let overlay_c = overlay[i + c] as f32 / 255.0;
                
                let blend_c = if base_c < 0.5 {
                    2.0 * base_c * overlay_c
                } else {
                    1.0 - 2.0 * (1.0 - base_c) * (1.0 - overlay_c)
                };
                let out_c = blend_c * overlay_alpha + base_c * (1.0 - overlay_alpha);
                result[i + c] = (out_c * 255.0) as u8;
            }
            
            let out_alpha = overlay_alpha + base_alpha * (1.0 - overlay_alpha);
            result[i + 3] = (out_alpha * 255.0) as u8;
        }
    }

    ImageData::new_with_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(&mut result),
        width,
        height,
    )
    .unwrap()
}

#[wasm_bindgen]
pub fn chroma_key(
    image_data: &ImageData,
    target_r: u8,
    target_g: u8,
    target_b: u8,
    threshold: f32,
    softness: f32,
) -> ImageData {
    let mut data = image_data.data().to_vec();
    let threshold_val = threshold * 441.672955;
    let softness_val = softness * 441.672955;

    for pixel in data.chunks_exact_mut(4) {
        let r = pixel[0] as f32;
        let g = pixel[1] as f32;
        let b = pixel[2] as f32;
        
        let dr = r - target_r as f32;
        let dg = g - target_g as f32;
        let db = b - target_b as f32;
        
        let dist = (dr * dr + dg * dg + db * db).sqrt();
        
        if dist <= threshold_val {
            pixel[3] = 0;
        } else if dist <= threshold_val + softness_val {
            let alpha = (dist - threshold_val) / softness_val;
            pixel[3] = (alpha * 255.0) as u8;
        }
    }

    ImageData::new_with_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(&mut data),
        image_data.width(),
        image_data.height(),
    )
    .unwrap()
}

#[wasm_bindgen]
pub fn inpaint(
    image_data: &ImageData,
    mask_data: &ImageData,
    radius: usize,
) -> ImageData {
    let width = image_data.width() as usize;
    let height = image_data.height() as usize;
    let mut src = image_data.data().to_vec();
    let mask = mask_data.data().to_vec();
    let mut dst = src.clone();

    let max_iterations = 3;

    for _ in 0..max_iterations {
        for y in 0..height {
            for x in 0..width {
                let idx = (y * width + x) * 4;
                
                if mask[idx] > 128 {
                    let mut sum_r = 0.0;
                    let mut sum_g = 0.0;
                    let mut sum_b = 0.0;
                    let mut weight_sum = 0.0;
                    
                    for dy in -(radius as i32)..=radius as i32 {
                        for dx in -(radius as i32)..=radius as i32 {
                            if dx == 0 && dy == 0 {
                                continue;
                            }
                            
                            let nx = x as i32 + dx;
                            let ny = y as i32 + dy;
                            
                            if nx >= 0 && nx < width as i32 && ny >= 0 && ny < height as i32 {
                                let nidx = (ny as usize * width + nx as usize) * 4;
                                
                                if mask[nidx] <= 128 {
                                    let dist = ((dx * dx + dy * dy) as f32).sqrt();
                                    let weight = 1.0 / (dist + 1.0);
                                    
                                    sum_r += src[nidx] as f32 * weight;
                                    sum_g += src[nidx + 1] as f32 * weight;
                                    sum_b += src[nidx + 2] as f32 * weight;
                                    weight_sum += weight;
                                }
                            }
                        }
                    }
                    
                    if weight_sum > 0.0 {
                        dst[idx] = (sum_r / weight_sum) as u8;
                        dst[idx + 1] = (sum_g / weight_sum) as u8;
                        dst[idx + 2] = (sum_b / weight_sum) as u8;
                    }
                }
            }
        }
        
        src.copy_from_slice(&dst);
    }

    ImageData::new_with_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(&mut dst),
        image_data.width(),
        image_data.height(),
    )
    .unwrap()
}

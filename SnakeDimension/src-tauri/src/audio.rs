use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SoundConfig {
    pub frequency: f32,
    pub duration: f32,
    pub volume: f32,
    pub sound_type: String,
}

fn generate_sine_wave(frequency: f32, duration: f32, sample_rate: u32) -> Vec<f32> {
    let num_samples = (duration * sample_rate as f32) as usize;
    let mut samples = Vec::with_capacity(num_samples);
    
    for i in 0..num_samples {
        let t = i as f32 / sample_rate as f32;
        let sample = (t * frequency * 2.0 * std::f32::consts::PI).sin();
        samples.push(sample);
    }
    
    samples
}

fn generate_square_wave(frequency: f32, duration: f32, sample_rate: u32) -> Vec<f32> {
    let num_samples = (duration * sample_rate as f32) as usize;
    let mut samples = Vec::with_capacity(num_samples);
    
    for i in 0..num_samples {
        let t = i as f32 / sample_rate as f32;
        let sample = if (t * frequency * 2.0 * std::f32::consts::PI).sin() > 0.0 {
            1.0
        } else {
            -1.0
        };
        samples.push(sample);
    }
    
    samples
}

fn generate_sawtooth_wave(frequency: f32, duration: f32, sample_rate: u32) -> Vec<f32> {
    let num_samples = (duration * sample_rate as f32) as usize;
    let mut samples = Vec::with_capacity(num_samples);
    
    for i in 0..num_samples {
        let t = i as f32 / sample_rate as f32;
        let sample = 2.0 * (t * frequency - (t * frequency + 0.5).floor());
        samples.push(sample);
    }
    
    samples
}

fn generate_triangle_wave(frequency: f32, duration: f32, sample_rate: u32) -> Vec<f32> {
    let num_samples = (duration * sample_rate as f32) as usize;
    let mut samples = Vec::with_capacity(num_samples);
    
    for i in 0..num_samples {
        let t = i as f32 / sample_rate as f32;
        let sample = 2.0 * (2.0 * (t * frequency - (t * frequency + 0.5).floor())).abs() - 1.0;
        samples.push(sample);
    }
    
    samples
}

fn generate_noise(duration: f32, sample_rate: u32) -> Vec<f32> {
    let num_samples = (duration * sample_rate as f32) as usize;
    let mut samples = Vec::with_capacity(num_samples);
    
    for i in 0..num_samples {
        let seed = (i as f32 * 0.12345).sin() * 43758.5453;
        let sample = (seed - seed.floor()) * 2.0 - 1.0;
        samples.push(sample);
    }
    
    samples
}

fn apply_envelope(samples: &mut [f32], attack: f32, decay: f32, sustain: f32, release: f32, sample_rate: u32) {
    let total_duration = samples.len() as f32 / sample_rate as f32;
    let sustain_duration = total_duration - attack - decay - release;
    
    for (i, sample) in samples.iter_mut().enumerate() {
        let t = i as f32 / sample_rate as f32;
        
        let envelope = if t < attack {
            t / attack
        } else if t < attack + decay {
            1.0 - (1.0 - sustain) * ((t - attack) / decay)
        } else if t < attack + decay + sustain_duration {
            sustain
        } else if t < total_duration {
            sustain * (1.0 - (t - attack - decay - sustain_duration) / release)
        } else {
            0.0
        };
        
        *sample *= envelope;
    }
}

#[tauri::command]
pub fn play_sound(config: SoundConfig) -> Result<(), String> {
    let sample_rate = 44100;
    
    let mut samples = match config.sound_type.as_str() {
        "sine" => generate_sine_wave(config.frequency, config.duration, sample_rate),
        "square" => generate_square_wave(config.frequency, config.duration, sample_rate),
        "sawtooth" => generate_sawtooth_wave(config.frequency, config.duration, sample_rate),
        "triangle" => generate_triangle_wave(config.frequency, config.duration, sample_rate),
        "noise" => generate_noise(config.duration, sample_rate),
        _ => generate_sine_wave(config.frequency, config.duration, sample_rate),
    };
    
    apply_envelope(&mut samples, 0.01, 0.1, 0.7, 0.2, sample_rate);
    
    for sample in &mut samples {
        *sample *= config.volume;
    }
    
    println!("Sound generated: {} samples", samples.len());
    
    Ok(())
}

#[tauri::command]
pub fn play_music(tempo: f32, scale: String) -> Result<(), String> {
    let sample_rate = 44100;
    let base_frequency = match scale.as_str() {
        "C" => 261.63,
        "C#" | "Db" => 277.18,
        "D" => 293.66,
        "D#" | "Eb" => 311.13,
        "E" => 329.63,
        "F" => 349.23,
        "F#" | "Gb" => 369.99,
        "G" => 392.00,
        "G#" | "Ab" => 415.30,
        "A" => 440.00,
        "A#" | "Bb" => 466.16,
        "B" => 493.88,
        _ => 440.00,
    };
    
    let major_scale = [1.0, 1.122, 1.260, 1.335, 1.498, 1.682, 1.888, 2.0];
    let note_duration = 60.0 / tempo;
    let total_duration = 4.0;
    let num_notes = (total_duration / note_duration) as usize;
    
    let mut all_samples = Vec::new();
    
    for i in 0..num_notes {
        let scale_degree = (i * 7) % 8;
        let frequency = base_frequency * major_scale[scale_degree];
        
        let mut note_samples = if i % 2 == 0 {
            generate_sine_wave(frequency, note_duration * 0.9, sample_rate)
        } else {
            generate_triangle_wave(frequency, note_duration * 0.9, sample_rate)
        };
        
        apply_envelope(&mut note_samples, 0.05, 0.1, 0.6, 0.1, sample_rate);
        
        for sample in &mut note_samples {
            *sample *= 0.3;
        }
        
        all_samples.extend(note_samples);
        
        let silence_duration = (note_duration * 0.1 * sample_rate as f32) as usize;
        all_samples.extend(std::iter::repeat(0.0).take(silence_duration));
    }
    
    println!("Music generated: {} samples", all_samples.len());
    
    Ok(())
}

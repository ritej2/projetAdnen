import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/app_theme.dart';
import '../models/interview_model.dart';

class VideoInterviewScreen extends StatefulWidget {
  final Interview interview;

  const VideoInterviewScreen({super.key, required this.interview});

  @override
  State<VideoInterviewScreen> createState() => _VideoInterviewScreenState();
}

class _VideoInterviewScreenState extends State<VideoInterviewScreen> {
  bool _micMuted = false;
  bool _cameraOff = false;

  Future<void> _openExternalMeeting() async {
    final url = Uri.parse(widget.interview.jitsiMeetingUrl);
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  void _copyMeetingLink() {
    Clipboard.setData(ClipboardData(text: widget.interview.jitsiMeetingUrl));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: AppColors.success,
        content: Text('Lien de la visioconférence copié dans le presse-papier !'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        foregroundColor: Colors.white,
        title: const Text('Entretien Vidéo HD', style: TextStyle(color: Colors.white)),
        actions: [
          IconButton(
            icon: const Icon(Icons.share, color: Colors.white),
            tooltip: 'Copier le lien d’invitation',
            onPressed: _copyMeetingLink,
          ),
          IconButton(
            icon: const Icon(Icons.open_in_browser, color: Colors.white),
            tooltip: 'Ouvrir en plein écran (Jitsi Meet)',
            onPressed: _openExternalMeeting,
          ),
        ],
      ),
      body: Column(
        children: [
          // Live Video Window Simulation / WebRTC Call Canvas
          Expanded(
            child: Container(
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: Stack(
                children: [
                  // Video stream representation
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircleAvatar(
                          radius: 48,
                          backgroundColor: AppColors.primary,
                          child: Icon(
                            _cameraOff ? Icons.videocam_off : Icons.person,
                            size: 48,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          widget.interview.nomEntreprise,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Entretien : ${widget.interview.offreTitre}',
                          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.circle, color: Color(0xFF10B981), size: 10),
                              SizedBox(width: 6),
                              Text(
                                'Salle WebRTC HD en direct',
                                style: TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Info chip top-left
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'Salle : JobFlow-Entretien-${widget.interview.id}',
                        style: const TextStyle(color: Colors.white70, fontSize: 11),
                      ),
                    ),
                  ),

                  // Open external button
                  Positioned(
                    bottom: 12,
                    left: 12,
                    right: 12,
                    child: OutlinedButton.icon(
                      onPressed: _openExternalMeeting,
                      icon: const Icon(Icons.open_in_new, size: 16, color: Colors.white),
                      label: const Text(
                        'Rejoindre en direct dans le navigateur (Jitsi Meet WebRTC)',
                        style: TextStyle(color: Colors.white, fontSize: 12),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.white30),
                        backgroundColor: Colors.black45,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // In-call Control Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            decoration: const BoxDecoration(
              color: Color(0xFF1E293B),
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Mic toggle
                _buildControlButton(
                  icon: _micMuted ? Icons.mic_off : Icons.mic,
                  color: _micMuted ? AppColors.danger : Colors.white,
                  bgColor: _micMuted ? const Color(0xFF7F1D1D) : const Color(0xFF334155),
                  onTap: () => setState(() => _micMuted = !_micMuted),
                ),

                // Camera toggle
                _buildControlButton(
                  icon: _cameraOff ? Icons.videocam_off : Icons.videocam,
                  color: _cameraOff ? AppColors.danger : Colors.white,
                  bgColor: _cameraOff ? const Color(0xFF7F1D1D) : const Color(0xFF334155),
                  onTap: () => setState(() => _cameraOff = !_cameraOff),
                ),

                // Copy link
                _buildControlButton(
                  icon: Icons.link,
                  color: Colors.white,
                  bgColor: const Color(0xFF334155),
                  onTap: _copyMeetingLink,
                ),

                // End call
                _buildControlButton(
                  icon: Icons.call_end,
                  color: Colors.white,
                  bgColor: AppColors.danger,
                  onTap: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required Color color,
    required Color bgColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(30),
      child: Container(
        width: 52,
        height: 52,
        decoration: BoxDecoration(
          color: bgColor,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: color, size: 24),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:amap_flutter_map/amap_flutter_map.dart';
import 'package:amap_flutter_location/amap_flutter_location.dart';
import '../providers/volunteer_provider.dart';
import '../models/volunteer.dart';
import '../models/help_request.dart';
import '../services/geohash_matching_service.dart';
import '../../amap/services/amap_service.dart';
import '../../arkit/services/ar_navigation_service.dart';
import '../widgets/volunteer_card.dart';
import '../widgets/help_request_card.dart';
import '../widgets/ar_navigation_widget.dart';

class VolunteerMatchingScreen extends StatefulWidget {
  const VolunteerMatchingScreen({super.key});

  @override
  State<VolunteerMatchingScreen> createState() => _VolunteerMatchingScreenState();
}

class _VolunteerMatchingScreenState extends State<VolunteerMatchingScreen>
    with TickerProviderStateMixin {
  late AMapController _mapController;
  late AMapFlutterLocation _locationPlugin;
  final AmapService _amapService = AmapService();
  final ARNavigationService _arNavigationService = ARNavigationService();
  
  TabController? _tabController;
  bool _isMapView = true;
  HelpRequest? _selectedRequest;
  List<Volunteer> _matchedVolunteers = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _initializeLocation();
    _initializeData();
  }

  @override
  void dispose() {
    _tabController?.dispose();
    _locationPlugin.destroy();
    super.dispose();
  }

  
    _locationPlugin = AMapFlutterLocation();
    _locationPlugin.onLocationChanged().listen((Map<String, Object> result) {
      setState(() {
        
      });
    });
  }

  
    final provider = context.read<VolunteerProvider>();
    await provider.initializeData();
  }

  
  void _onMapCreated(AMapController controller) {
    _mapController = controller;
    _setInitialCameraPosition();
  }

  
  void _setInitialCameraPosition() {
    final provider = context.read<VolunteerProvider>();
    if (provider.currentPosition != null) {
      _mapController.moveCamera(
        CameraUpdate.newLatLng(
          LatLng(
            provider.currentPosition!.latitude,
            provider.currentPosition!.longitude,
          ),
        ),
      );
    }
  }

  
  void _createHelpRequest() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => const CreateHelpRequestSheet(),
    );
  }

  
  Future<void> _selectHelpRequest(HelpRequest request) async {
    setState(() {
      _selectedRequest = request;
    });

    
    final volunteers = await provider.findNearbyVolunteers(request);
    
    setState(() {
      _matchedVolunteers = volunteers;
    });

    
  }

  
    if (_selectedRequest == null) return;

    final provider = context.read<VolunteerProvider>();
    await provider.matchVolunteerToRequest(_selectedRequest!.id, volunteer.id);

    
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('匹配成功'),
          content: Text('已成功匹配志愿�?${volunteer.name}'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('确定'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                _startARNavigation(volunteer);
              },
              child: const Text('开始AR导航'),
            ),
          ],
        ),
      );
    }
  }

  
  void _startARNavigation(Volunteer volunteer) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ARNavigationWidget(
          targetLatitude: volunteer.latitude,
          targetLongitude: volunteer.longitude,
          volunteerName: volunteer.name,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('志愿者匹配系�?),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(_isMapView ? Icons.list : Icons.map),
            onPressed: () {
              setState(() {
                _isMapView = !_isMapView;
              });
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: '求助请求'),
            Tab(text: '附近志愿�?),
          ],
        ),
      ),
      body: Consumer<VolunteerProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('错误: ${provider.error}'),
                  ElevatedButton(
                    onPressed: () => provider.initializeData(),
                    child: const Text('重试'),
                  ),
                ],
              ),
            );
          }

          return TabBarView(
            controller: _tabController,
            children: [
              
              
              _buildVolunteersTab(provider),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _createHelpRequest,
        backgroundColor: Colors.red,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add),
      ),
    );
  }

  
    if (_isMapView) {
      return _buildMapView(provider);
    } else {
      return _buildListView(provider);
    }
  }

  
  Widget _buildMapView(VolunteerProvider provider) {
    return Stack(
      children: [
        AMapWidget(
          apiKey: const AMapApiKey(
            androidKey: 'YOUR_ANDROID_AMAP_KEY',
            iosKey: 'YOUR_IOS_AMAP_KEY',
          ),
          onMapCreated: _onMapCreated,
          markers: _createMarkers(provider),
          polylines: _createPolylines(provider),
        ),
        
        Positioned(
          top: 16,
          right: 16,
          child: Column(
            children: [
              FloatingActionButton.small(
                onPressed: () => _mapController.moveCamera(
                  CameraUpdate.zoomIn(),
                ),
                child: const Icon(Icons.add),
              ),
              const SizedBox(height: 8),
              FloatingActionButton.small(
                onPressed: () => _mapController.moveCamera(
                  CameraUpdate.zoomOut(),
                ),
                child: const Icon(Icons.remove),
              ),
            ],
          ),
        ),
      ],
    );
  }

  
  Set<Marker> _createMarkers(VolunteerProvider provider) {
    Set<Marker> markers = {};

    
    for (HelpRequest request in provider.helpRequests) {
      markers.add(
        Marker(
          markerId: MarkerId('request_${request.id}'),
          position: LatLng(request.latitude, request.longitude),
          infoWindow: InfoWindow(
            title: request.title,
            snippet: request.description,
            onTap: () => _selectHelpRequest(request),
          ),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
        ),
      );
    }

    
      if (volunteer.isAvailable) {
        markers.add(
          Marker(
            markerId: MarkerId('volunteer_${volunteer.id}'),
            position: LatLng(volunteer.latitude, volunteer.longitude),
            infoWindow: InfoWindow(
              title: volunteer.name,
              snippet: '技�? ${volunteer.skills.join(", ")}',
            ),
            icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
          ),
        );
      }
    }

    return markers;
  }

  
  Set<Polyline> _createPolylines(VolunteerProvider provider) {
    Set<Polyline> polylines = {};

    
    if (_selectedRequest != null && _matchedVolunteers.isNotEmpty) {
      final volunteer = _matchedVolunteers.first;
      polylines.add(
        Polyline(
          polylineId: const PolylineId('route'),
          points: [
            LatLng(_selectedRequest!.latitude, _selectedRequest!.longitude),
            LatLng(volunteer.latitude, volunteer.longitude),
          ],
          color: Colors.blue,
          width: 3,
        ),
      );
    }

    return polylines;
  }

  
  Widget _buildListView(VolunteerProvider provider) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: provider.helpRequests.length,
      itemBuilder: (context, index) {
        final request = provider.helpRequests[index];
        return HelpRequestCard(
          request: request,
          onTap: () => _selectHelpRequest(request),
          onMatch: () async {
            final volunteers = await provider.findNearbyVolunteers(request);
            if (volunteers.isNotEmpty) {
              _matchVolunteer(volunteers.first);
            }
          },
        );
      },
    );
  }

  
  Widget _buildVolunteersTab(VolunteerProvider provider) {
    final volunteers = _selectedRequest != null 
        ? _matchedVolunteers 
        : provider.volunteers.where((v) => v.isAvailable).toList();

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: volunteers.length,
      itemBuilder: (context, index) {
        final volunteer = volunteers[index];
        return VolunteerCard(
          volunteer: volunteer,
          onTap: () => _showVolunteerDetails(volunteer),
          onMatch: _selectedRequest != null 
              ? () => _matchVolunteer(volunteer)
              : null,
        );
      },
    );
  }

  
    showModalBottomSheet(
      context: context,
      builder: (context) => VolunteerDetailsSheet(volunteer: volunteer),
    );
  }
}


class CreateHelpRequestSheet extends StatefulWidget {
  const CreateHelpRequestSheet({super.key});

  @override
  State<CreateHelpRequestSheet> createState() => _CreateHelpRequestSheetState();
}

class _CreateHelpRequestSheetState extends State<CreateHelpRequestSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _phoneController = TextEditingController();
  final List<String> _selectedSkills = [];
  int _urgency = 3;

  final List<String> _availableSkills = [
    '医疗救助',
    '紧急救�?,
    '心理疏导',
    '技术支�?,
    '体力劳动',
    '翻译',
    '设备维修',
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: '求助标题',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return '请输入求助标�?;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: '详细描述',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return '请输入详细描�?;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(
                  labelText: '联系电话',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.phone,
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return '请输入联系电�?;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              const Text('需要的技�?'),
              Wrap(
                spacing: 8,
                children: _availableSkills.map((skill) {
                  final isSelected = _selectedSkills.contains(skill);
                  return FilterChip(
                    label: Text(skill),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        if (selected) {
                          _selectedSkills.add(skill);
                        } else {
                          _selectedSkills.remove(skill);
                        }
                      });
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              const Text('紧急程�?'),
              Slider(
                value: _urgency.toDouble(),
                min: 1,
                max: 5,
                divisions: 4,
                label: _urgency.toString(),
                onChanged: (value) {
                  setState(() {
                    _urgency = value.round();
                  });
                },
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _submitRequest,
                  child: const Text('提交求助请求'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _submitRequest() async {
    if (!_formKey.currentState!.validate()) return;

    final provider = context.read<VolunteerProvider>();
    if (provider.currentPosition == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('无法获取当前位置')),
      );
      return;
    }

    final request = HelpRequest(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: _titleController.text,
      description: _descriptionController.text,
      requesterId: 'current_user',
      requesterName: '当前用户',
      requesterPhone: _phoneController.text,
      latitude: provider.currentPosition!.latitude,
      longitude: provider.currentPosition!.longitude,
      geohash: GeohashMatchingService.generateGeohash(
        provider.currentPosition!.latitude,
        provider.currentPosition!.longitude,
      ),
      requiredSkills: _selectedSkills,
      createdAt: DateTime.now(),
      urgency: _urgency,
    );

    await provider.createHelpRequest(request);
    
    if (mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('求助请求已提�?)),
      );
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _phoneController.dispose();
    super.dispose();
  }
}


  final Volunteer volunteer;

  const VolunteerDetailsSheet({super.key, required this.volunteer});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            volunteer.name,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text('电话: ${volunteer.phone}'),
          const SizedBox(height: 8),
          Text('评分: ${volunteer.rating}/5.0'),
          const SizedBox(height: 8),
          Text('完成任务: ${volunteer.completedTasks}�?),
          const SizedBox(height: 8),
          const Text('技�?'),
          Wrap(
            spacing: 8,
            children: volunteer.skills.map((skill) {
              return Chip(label: Text(skill));
            }).toList(),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                
              },
              child: const Text('联系志愿�?),
            ),
          ),
        ],
      ),
    );
  }
} 

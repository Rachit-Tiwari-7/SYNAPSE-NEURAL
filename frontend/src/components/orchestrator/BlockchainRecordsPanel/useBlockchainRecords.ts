import { useState, useEffect, useCallback } from 'react';
import { fetchBlockchainRecords, deleteBlockchainRecord, HealthRecord } from '@/lib/supabase';
import { PatientInfo } from '../types';
import { MockHealthProfile, MOCK_HEALTH_PROFILES } from '@/data/mockHealthProfiles';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface UseBlockchainRecordsProps {
  patient?: PatientInfo;
  activeProfile?: MockHealthProfile;
  selectedProfileId?: string;
  onSelectProfile?: (id: string) => void;
}

function parseYearOfBirth(dob?: string, age?: number, fallbackYear: string = '2002'): string {
  if (dob) {
    const match = dob.match(/\b(19\d\d|20\d\d)\b/);
    if (match) return match[1];
  }
  if (age) {
    return String(2026 - age);
  }
  return fallbackYear;
}

export function useBlockchainRecords(props?: UseBlockchainRecordsProps) {
  const [activeTab, setActiveTab] = useState<'abha' | 'passport' | 'vaccination'>('abha');
  
  // Active Profile ID tracking
  const [currentProfileId, setCurrentProfileId] = useState<string>(
    props?.selectedProfileId || props?.activeProfile?.profileId || 'rachit_tiwari_verified_abha'
  );

  // Active ABHA form / card state
  const [name, setName] = useState<string>(props?.patient?.name || props?.activeProfile?.patient?.name || 'Rachit Tiwari');
  const [yearOfBirth, setYearOfBirth] = useState<string>(
    props?.patient?.dob ? parseYearOfBirth(props.patient.dob) : '2003'
  );
  const [dob, setDob] = useState<string>(props?.patient?.dob || 'June 18, 2003');
  const [abhaData, setAbhaData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Registry Cache
  const [registry, setRegistry] = useState<any[]>([]);

  // Health Records list
  const [records, setRecords] = useState<any[]>([]);

  // Refresh records from Supabase / localStorage
  const loadSupabaseRecords = useCallback(async (profileId: string, abhaId?: string, fallbackRecords?: any[]) => {
    try {
      const dbRecords = await fetchBlockchainRecords(profileId, abhaId);
      if (dbRecords && dbRecords.length > 0) {
        // Normalize fields for UI display
        const normalized = dbRecords.map((r: HealthRecord) => ({
          id: r.id,
          profile_id: r.profile_id,
          patient: r.patient_name,
          abha: r.abha_number,
          hash: r.tx_hash || 'Verified-ABDM-Record',
          cid: r.cid || r.id,
          type: r.record_type,
          timestamp: r.timestamp_raw,
          facility: r.facility,
          verified: r.verified !== false
        }));
        setRecords(normalized);
        return;
      }
    } catch (err) {
      console.warn('Error loading records from database:', err);
    }

    if (fallbackRecords) {
      setRecords(fallbackRecords);
    }
  }, []);

  // Synchronize with selected patient profile
  const applyProfileData = useCallback((profileId: string, customRegistry?: any[]) => {
    const regList = customRegistry || registry;
    const matchedCitizen = regList.find((c: any) => c.id === profileId || c.name?.toLowerCase() === profileId.toLowerCase());
    const matchedMock = MOCK_HEALTH_PROFILES.find((p) => p.profileId === profileId) || MOCK_HEALTH_PROFILES[0];

    const citizenName = matchedCitizen?.name || matchedMock.patient.name || props?.patient?.name || 'Rachit Tiwari';
    const citizenDob = matchedCitizen?.dob || matchedMock.patient.dob || props?.patient?.dob || 'June 18, 2003';
    const citizenYob = matchedCitizen?.yearOfBirth ? String(matchedCitizen.yearOfBirth) : parseYearOfBirth(citizenDob, matchedMock.patient.age);
    const citizenAbha = matchedCitizen?.abhaNumber || matchedMock.patient.abhaId || '91-8842-1920-7463';
    const citizenAddress = matchedCitizen?.abhaAddress || `${citizenName.toLowerCase().replace(/\s+/g, '')}@abdm`;
    const citizenGender = matchedCitizen?.gender || matchedMock.patient.gender || props?.patient?.gender || 'Male';
    const citizenBlood = matchedCitizen?.bloodType || matchedMock.patient.bloodType || props?.patient?.bloodType || 'O+';
    const citizenPolicy = matchedCitizen?.policyNumber || matchedMock.patient.policyNumber || props?.patient?.policyNumber || 'PM-JAY-2026-IND-9924';
    const citizenHip = matchedCitizen?.linkedHip || matchedMock.patient.linkedHip || "King George's Medical University (KGMU) & AIIMS Node";
    const citizenState = matchedCitizen?.stateCode || matchedMock.patient.stateCode || 'UP';

    setName(citizenName);
    setDob(citizenDob);
    setYearOfBirth(citizenYob);

    setAbhaData({
      status: 'ACTIVE',
      abha_number: citizenAbha,
      abha_address: citizenAddress,
      name: citizenName,
      year_of_birth: citizenYob,
      dob: citizenDob,
      gender: citizenGender,
      blood_type: citizenBlood,
      policy_number: citizenPolicy,
      pm_jay_eligible: true,
      pm_jay_benefit: '₹5,00,000 / Year Free Hospitalization Coverage (PM-JAY)',
      linked_hip: citizenHip,
      state_code: citizenState,
      avatar_url: matchedCitizen?.avatarUrl || (matchedMock.patient ? `/images/${matchedMock.patient.name.toLowerCase().replace(/\s+/g, '_')}.jpg` : ''),
      device: matchedCitizen?.device || matchedMock.device?.name || 'Ayushman Bharat Verified'
    });

    const citizenFallbackRecords = matchedCitizen?.blockchainRecords || [
      {
        id: `REC-${Math.floor(1000 + Math.random() * 9000)}-${citizenName.slice(0, 2).toUpperCase()}`,
        profile_id: profileId,
        patient: citizenName,
        abha: citizenAbha,
        type: 'Clinical Health Summary & Triage',
        timestamp: '2026-08-18 11:45 UTC',
        facility: citizenHip,
        verified: true
      }
    ];

    // Load persistent records
    loadSupabaseRecords(profileId, citizenAbha, citizenFallbackRecords);
  }, [registry, props?.patient, loadSupabaseRecords]);

  // Load ABDM Registry JSON on mount
  useEffect(() => {
    fetch('/data/mockHealthData/abha_registry.json')
      .then((res) => res.json())
      .then((data) => {
        if (data.citizens && Array.isArray(data.citizens)) {
          setRegistry(data.citizens);
          const initialId = props?.selectedProfileId || props?.activeProfile?.profileId || 'rachit_tiwari_verified_abha';
          applyProfileData(initialId, data.citizens);
        }
      })
      .catch(() => {
        const initialId = props?.selectedProfileId || props?.activeProfile?.profileId || 'rachit_tiwari_verified_abha';
        applyProfileData(initialId);
      });
  }, []);

  // Listen for external profile switches
  useEffect(() => {
    if (props?.selectedProfileId && props.selectedProfileId !== currentProfileId) {
      setCurrentProfileId(props.selectedProfileId);
      applyProfileData(props.selectedProfileId);
    }
  }, [props?.selectedProfileId, applyProfileData]);

  useEffect(() => {
    const handleProfileSwitchEvent = (e: any) => {
      const pid = e.detail?.profileId;
      if (pid) {
        setCurrentProfileId(pid);
        applyProfileData(pid);
      }
    };
    window.addEventListener('synapseos-profile-switch', handleProfileSwitchEvent);
    return () => window.removeEventListener('synapseos-profile-switch', handleProfileSwitchEvent);
  }, [applyProfileData]);

  // Change active profile from within the ABHA panel
  const handleSwitchProfile = (profileId: string) => {
    setCurrentProfileId(profileId);
    applyProfileData(profileId);
    if (props?.onSelectProfile) {
      props.onSelectProfile(profileId);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('synapseos-profile-switch', {
        detail: { profileId }
      }));
      localStorage.setItem('synapseos_selected_profile_id', profileId);
    }
  };

  const handleGenerateAbha = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/abdm/generate-id?name=${encodeURIComponent(name)}&year_of_birth=${yearOfBirth}`);
      if (res.ok) {
        const data = await res.json();
        setAbhaData({
          ...data,
          dob: dob || `${yearOfBirth}-01-01`,
          gender: abhaData?.gender || 'Male',
          blood_type: abhaData?.blood_type || 'O+',
          policy_number: abhaData?.policy_number || `PM-JAY-2026-IND-${Math.floor(1000 + Math.random() * 9000)}`
        });
      } else {
        const cleanName = name.toLowerCase().replace(/\s+/g, '');
        const p1 = Math.floor(10 + Math.random() * 90);
        const p2 = Math.floor(1000 + Math.random() * 9000);
        const p3 = Math.floor(1000 + Math.random() * 9000);
        const p4 = Math.floor(1000 + Math.random() * 9000);
        setAbhaData({
          status: 'ACTIVE',
          abha_number: `${p1}-${p2}-${p3}-${p4}`,
          abha_address: `${cleanName}${yearOfBirth.slice(-2)}@abdm`,
          name: name,
          year_of_birth: yearOfBirth,
          dob: dob,
          gender: abhaData?.gender || 'Male',
          blood_type: abhaData?.blood_type || 'O+',
          policy_number: abhaData?.policy_number || 'PM-JAY-2026-IND-8841',
          pm_jay_eligible: true,
          pm_jay_benefit: '₹5,00,000 / Year Free Hospitalization Coverage (PM-JAY)',
          linked_hip: 'All India Institute of Medical Sciences (AIIMS) - Central Node'
        });
      }
    } catch (e) {
      const cleanName = name.toLowerCase().replace(/\s+/g, '');
      setAbhaData({
        status: 'ACTIVE',
        abha_number: abhaData?.abha_number || '91-8842-1920-7463',
        abha_address: `${cleanName}${yearOfBirth.slice(-2)}@abdm`,
        name: name,
        year_of_birth: yearOfBirth,
        dob: dob,
        gender: abhaData?.gender || 'Male',
        blood_type: abhaData?.blood_type || 'O+',
        policy_number: abhaData?.policy_number || 'PM-JAY-2026-IND-9924',
        pm_jay_eligible: true,
        pm_jay_benefit: '₹5,00,000 / Year Free Hospitalization Coverage (PM-JAY)',
        linked_hip: "King George's Medical University (KGMU) & AIIMS Node"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: name,
          abha_id: abhaData?.abha_number || '91-8842-1920-7463',
          triage_summary: `Sanjeevni-OS Clinical Triage for ${name}: Vitals stable, verified ABDM record.`
        })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Sanjeevni_Health_Passport_${name.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      alert('Unable to connect to backend PDF service. Ensure backend is running at port 8000.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteRecord = useCallback(async (recordId: string) => {
    try {
      await deleteBlockchainRecord(recordId);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
    } catch (err) {
      console.error('Failed to delete record:', err);
    }
  }, []);

  return {
    activeTab, setActiveTab,
    currentProfileId,
    handleSwitchProfile,
    abhaData, setAbhaData,
    name, setName,
    dob, setDob,
    yearOfBirth, setYearOfBirth,
    loading, setLoading,
    downloading, setDownloading,
    records, setRecords,
    handleGenerateAbha,
    handleDownloadPdf,
    handleDeleteRecord,
    walletAddress: null,
    walletMode: 'burner',
    contractOk: false,
    networkName: 'abdm',
    connecting: false,
    walletError: null,
    connectBurner: () => {},
    connectMetaMask: () => {},
    refreshRecords: () => loadSupabaseRecords(currentProfileId, abhaData?.abha_number)
  };
}

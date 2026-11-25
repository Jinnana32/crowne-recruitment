"use client";

import { use } from "react";
import { CandidateProfileScreen } from "@/features/agency/candidate-profile-screen";

export default function CandidateProfilePage({ params }: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = use(params);
  return <CandidateProfileScreen candidateId={candidateId} />;
}

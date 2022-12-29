import { artifacts as hhArtifacts, ethers } from "hardhat";
import { assert } from "console";
import { join } from "path";
import { readFileSync } from "fs";

export const ZERO_GAS_OPTS = { gasPrice: 0 };

export async function getL2Factory(name: string) {
  const l1ArtifactPaths = await hhArtifacts.getArtifactPaths();
  const desiredArtifacts = l1ArtifactPaths.filter(a => a.endsWith(`/${name}.json`));
  assert(desiredArtifacts.length === 1, "Couldn't find desired artifact or found too many");

  const l1ArtifactPath = desiredArtifacts[0];
  const artifactRootPath = join(__dirname, "../../artifacts");
  const artifactOvmRootPath = join(__dirname, "../../artifacts-ovm");
  const l2ArtifactPath = l1ArtifactPath.replace(artifactRootPath, artifactOvmRootPath);

  const artifact = JSON.parse(readFileSync(l2ArtifactPath, "utf-8"));

  return new ethers.ContractFactory(artifact.abi, artifact.bytecode);
}

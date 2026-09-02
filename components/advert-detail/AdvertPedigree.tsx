import React, { memo, useCallback, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { useIsWideLayout } from '@/hooks/useLayoutWidth';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { PedigreeEntry } from '@/types';
import { openTjkHorseSearch } from './AdvertSpecs';

type AdvertPedigreeProps = {
  pedigree?: PedigreeEntry[];
  horseName?: string;
  sireFallback?: string;
  damFallback?: string;
  damsireFallback?: string;
};

type PedigreeNode = {
  raw: string;
  name: string;
  coat?: string;
  year?: string;
  country?: string;
  role: string;
  gender: 'male' | 'female';
  gen: 0 | 1 | 2 | 3;
};

/**
 * Parses raw pedigree strings like "AĞA KARACA ka (1995)" or "ADAGÜLÜ kk (2004)"
 * into clean horse name, coat (don), birth year, and country.
 */
function parsePedigreeNode(
  raw: string | null | undefined,
  role: string,
  gender: 'male' | 'female',
  gen: 0 | 1 | 2 | 3
): PedigreeNode {
  if (!raw || raw.trim() === '' || raw.trim() === '-') {
    return {
      raw: '-',
      name: '-',
      role,
      gender,
      gen,
    };
  }

  const trimmed = raw.trim();

  // Extract year e.g. (1995) or [1995]
  const yearMatch = trimmed.match(/\((19\d{2}|20\d{2})\)|\[(19\d{2}|20\d{2})\]/);
  const year = yearMatch ? yearMatch[1] || yearMatch[2] : undefined;

  // Extract country e.g. (USA), (IRE), (GB), (FR), (GER), (TUR), (JPN)
  const countryMatch = trimmed.match(/\(([A-Z]{2,3})\)/);
  const country = countryMatch ? countryMatch[1] : undefined;

  // Clean parenthesized & bracketed tokens from name
  let clean = trimmed.replace(/\s*[\(\[].*?[\)\]]/g, '').trim();

  // Detect coat / don abbreviations ONLY at the end of the name token
  // Matches " k a", " ka", " d a", " da", " al", " kır", " doru", " yağız", " aa", " ak", " ae", " yk", " ya" etc.
  const coatEndRegex = /\s+(k\s*a|k\s*k|d\s*a|d\s*k|a\s*a|a\s*k|y\s*a|y\s*k|d\s*ö|b\s*a|kır|doru|al|yağız)$/i;
  const coatMatch = clean.match(coatEndRegex);
  let coat: string | undefined;
  if (coatMatch && coatMatch[1]) {
    coat = coatMatch[1].replace(/\s+/g, '').toLowerCase();
    clean = clean.replace(coatEndRegex, '').trim();
  }

  const finalName = clean || trimmed;

  return {
    raw: trimmed,
    name: finalName || '-',
    coat,
    year,
    country,
    role,
    gender,
    gen,
  };
}

export const AdvertPedigree = memo(function AdvertPedigree({
  pedigree,
  horseName,
  sireFallback,
  damFallback,
  damsireFallback,
}: AdvertPedigreeProps) {
  const isWide = useIsWideLayout();
  const [viewMode, setViewMode] = useState<'diagram' | 'table'>('diagram');
  const [activeBranch, setActiveBranch] = useState<'all' | 'sire' | 'dam'>('all');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScroll, setCanScroll] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const currentScrollXRef = useRef(0);

  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const textSecondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const primary = useThemeColor('primary');

  const scrollToOffset = (offset: number) => {
    scrollRef.current?.scrollTo({ x: Math.max(0, offset), animated: true });
  };

  const handleBranchChange = (branch: 'all' | 'sire' | 'dam') => {
    setActiveBranch(branch);
    scrollToOffset(0);
  };

  const handleScrollStep = (dir: 'left' | 'right') => {
    const delta = dir === 'left' ? -220 : 220;
    const target = currentScrollXRef.current + delta;
    scrollToOffset(target);
  };

  const p = pedigree ?? [];

  // 1. Kuşak (Ebeveynler)
  const sireRaw = p[0]?.father || sireFallback;
  const damRaw = p[0]?.mother || damFallback;

  // 2. Kuşak (Dede & Nine)
  const sireSireRaw = p[1]?.father;
  const sireDamRaw = p[1]?.mother;
  const damSireRaw = p[2]?.father || damsireFallback;
  const damDamRaw = p[2]?.mother;

  // 3. Kuşak (Büyük Atalar)
  const sireSireSireRaw = p[3]?.father;
  const sireSireDamRaw = p[3]?.mother;
  const sireDamSireRaw = p[4]?.father;
  const sireDamDamRaw = p[4]?.mother;

  const damSireSireRaw = p[5]?.father;
  const damSireDamRaw = p[5]?.mother;
  const damDamSireRaw = p[6]?.father;
  const damDamDamRaw = p[6]?.mother;

  const hasData = Boolean(
    (sireRaw && sireRaw !== '-') ||
    (damRaw && damRaw !== '-') ||
    p.length > 0
  );

  if (!hasData) return null;

  // Root Node (İlan Sahibi Safkan)
  const rootNode: PedigreeNode = {
    raw: horseName || 'İLAN SAFKANI',
    name: horseName || 'İLAN SAFKANI',
    role: 'Safkan (Orijin)',
    gender: 'male',
    gen: 0,
  };

  const sireTree = {
    g1: parsePedigreeNode(sireRaw, 'Baba', 'male', 1),
    g2_top: parsePedigreeNode(sireSireRaw, 'Babanın Babası', 'male', 2),
    g3_top1: parsePedigreeNode(sireSireSireRaw, 'BB Babası', 'male', 3),
    g3_top2: parsePedigreeNode(sireSireDamRaw, 'BB Annesi', 'female', 3),
    g2_bot: parsePedigreeNode(sireDamRaw, 'Babanın Annesi', 'female', 2),
    g3_bot1: parsePedigreeNode(sireDamSireRaw, 'BA Babası', 'male', 3),
    g3_bot2: parsePedigreeNode(sireDamDamRaw, 'BA Annesi', 'female', 3),
  };

  const damTree = {
    g1: parsePedigreeNode(damRaw, 'Anne', 'female', 1),
    g2_top: parsePedigreeNode(damSireRaw, 'Kısrak Babası', 'male', 2),
    g3_top1: parsePedigreeNode(damSireSireRaw, 'KB Babası', 'male', 3),
    g3_top2: parsePedigreeNode(damSireDamRaw, 'KB Annesi', 'female', 3),
    g2_bot: parsePedigreeNode(damDamRaw, 'Annenin Annesi', 'female', 2),
    g3_bot1: parsePedigreeNode(damDamSireRaw, 'AA Babası', 'male', 3),
    g3_bot2: parsePedigreeNode(damDamDamRaw, 'AA Annesi', 'female', 3),
  };

  // Node Card Renderer for Tree Diagram
  const renderDiagramCard = (
    node: PedigreeNode,
    customStyle?: any,
    isRootCard?: boolean
  ) => {
    const isRoot = isRootCard ?? node.gen === 0;
    const isMale = node.gender === 'male';
    const accentColor = isRoot ? primary : isMale ? '#38bdf8' : '#f472b6';
    const bgTint = isRoot
      ? `${primary}14`
      : isMale
        ? 'rgba(56, 189, 248, 0.08)'
        : 'rgba(244, 114, 182, 0.08)';
    const cardBorderColor = isRoot
      ? `${primary}70`
      : isMale
        ? 'rgba(56, 189, 248, 0.3)'
        : 'rgba(244, 114, 182, 0.3)';
    const isValid = node.name && node.name !== '-';

    const hasMeta = Boolean(node.year || node.coat || node.country);

    return (
      <Pressable
        onPress={() => isValid && !isRoot && openTjkHorseSearch(node.raw || node.name)}
        disabled={!isValid || isRoot}
        accessibilityRole="button"
        accessibilityLabel={`${node.role}: ${node.name}`}
        style={({ pressed }) => [
          styles.dNodeCard,
          node.gen === 0 && styles.dCardG0,
          node.gen === 1 && styles.dCardG1,
          node.gen === 2 && styles.dCardG2,
          node.gen === 3 && styles.dCardG3,
          {
            backgroundColor: bgTint,
            borderColor: isValid ? cardBorderColor : border,
            opacity: isValid ? 1 : 0.45,
          },
          isValid && !isRoot && {
            borderLeftWidth: 3,
            borderLeftColor: accentColor,
            ...Platform.select({
              web: {
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              } as any,
              default: {},
            }),
          },
          pressed && isValid && !isRoot && {
            transform: [{ scale: 0.98 }],
            opacity: 0.85,
          },
          customStyle,
        ]}
      >
        {/* Header: Role & Icons */}
        <View style={styles.dCardHeader}>
          <View style={styles.dRoleBadge}>
            <Ionicons
              name={isRoot ? 'ribbon' : isMale ? 'male' : 'female'}
              size={node.gen === 3 ? 9.5 : 10.5}
              color={accentColor}
            />
            <Text
              style={[
                styles.dRoleText,
                { color: accentColor },
                node.gen === 3 && styles.dRoleTextG3,
              ]}
              numberOfLines={1}
            >
              {node.role}
            </Text>
          </View>

          {node.gen === 1 && (
            <Text style={[styles.dGenBadge, { color: accentColor }]}>%50</Text>
          )}
          {node.gen === 2 && (
            <Text style={[styles.dGenBadge, { color: textSecondary }]}>%25</Text>
          )}

          {isValid && !isRoot ? (
            <Ionicons
              name="open-outline"
              size={9.5}
              color={textMuted}
            />
          ) : null}
        </View>

        {/* Horse Name */}
        <Text
          style={[
            styles.dNodeName,
            { color: text },
            node.gen === 0 && styles.dNodeNameG0,
            node.gen === 1 && styles.dNodeNameG1,
            node.gen === 2 && styles.dNodeNameG2,
            node.gen === 3 && styles.dNodeNameG3,
          ]}
          numberOfLines={node.gen === 3 ? 2 : 1}
        >
          {node.name}
        </Text>

        {/* Fixed-Height Metadata Row */}
        {hasMeta ? (
          <View style={styles.dMetaRow}>
            {node.coat ? (
              <View style={[styles.dMetaBadge, { backgroundColor: `${accentColor}18` }]}>
                <Text style={[styles.dMetaBadgeText, { color: accentColor, fontWeight: '700' }]}>
                  {node.coat.toUpperCase()}
                </Text>
              </View>
            ) : null}

            {node.year ? (
              <View style={[styles.dMetaBadge, { backgroundColor: `${textSecondary}15` }]}>
                <Ionicons name="calendar-outline" size={8} color={textSecondary} />
                <Text style={[styles.dMetaBadgeText, { color: textSecondary }]}>
                  {node.year}
                </Text>
              </View>
            ) : null}

            {node.country ? (
              <View style={[styles.dMetaBadge, { backgroundColor: `${textSecondary}15` }]}>
                <Text style={[styles.dMetaBadgeText, { color: textSecondary }]}>
                  {node.country}
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.dMetaPlaceholder} />
        )}
      </Pressable>
    );
  };

  // --- 1. GÖRÜNÜM: SOY AĞACI DİYAGRAMI (Tree Diagram) ---
  const renderTreeDiagram = () => {
    const isFocused = activeBranch !== 'all';
    const showSire = activeBranch === 'all' || activeBranch === 'sire';
    const showDam = activeBranch === 'all' || activeBranch === 'dam';

    return (
      <View
        style={[
          styles.treeDiagramContainer,
          isFocused && styles.treeDiagramContainerFocused,
          { borderColor: border, backgroundColor: `${surface}25` },
        ]}
      >
        {/* 1. SEVİYE: KÖK AT (Root Node - ADAAĞASI) */}
        <View style={styles.levelRootWrap}>
          <View style={styles.rootCardContainer}>
            {renderDiagramCard(
              rootNode,
              isFocused ? styles.rootCardStyleFocused : styles.rootCardStyle,
              true
            )}
          </View>

          {/* Root Downward Connector */}
          {activeBranch === 'all' ? (
            <>
              <View style={styles.rootStemLine} />
              <View style={styles.rootForkWrap}>
                <View style={[styles.rootForkHorizontal, { borderColor: border }]} />
                <View style={[styles.rootDropLeft, { borderColor: '#38bdf8' }]} />
                <View style={[styles.rootDropRight, { borderColor: '#f472b6' }]} />
              </View>
            </>
          ) : (
            <View
              style={[
                styles.rootDirectLine,
                { backgroundColor: activeBranch === 'sire' ? '#38bdf8' : '#f472b6' },
              ]}
            />
          )}
        </View>

        {/* 2. & 3. & 4. SEVİYELER (BABA VE ANNE AĞAÇLARI) */}
        <View style={[styles.mainBranchesRow, isFocused && styles.mainBranchesRowFocused]}>
          {/* SOL AĞAÇ: BABA HATTI (Sire Tree) */}
          {showSire && (
            <View style={[styles.branchTreeHalf, isFocused && styles.branchTreeHalfFocused]}>
              {/* Gen 1: Baba Card */}
              <View style={styles.treeLevelCardWrap}>
                {renderDiagramCard(
                  sireTree.g1,
                  isFocused ? styles.cardG1StyleFocused : styles.cardG1Style
                )}
              </View>

              {/* Fork to Gen 2 */}
              <View style={[styles.forkStemWrap, isFocused && styles.forkStemWrapFocused]}>
                <View style={[styles.forkStemVertical, { borderColor: '#38bdf8' }]} />
                <View style={[styles.forkBarHorizontal, { borderColor: '#38bdf8' }]} />
                <View style={[styles.forkDropLeft, { borderColor: '#38bdf8' }]} />
                <View style={[styles.forkDropRight, { borderColor: '#38bdf8' }]} />
              </View>

              {/* Gen 2: Babanın Babası & Babanın Annesi */}
              <View style={[styles.treeLevelRowG2, isFocused && styles.treeLevelRowG2Focused]}>
                {/* Gen 2 Sol (Babanın Babası) */}
                <View style={styles.treeSubBranch}>
                  <View style={styles.treeLevelCardWrap}>
                    {renderDiagramCard(
                      sireTree.g2_top,
                      isFocused ? styles.cardG2StyleFocused : styles.cardG2Style
                    )}
                  </View>

                  {/* Fork to Gen 3 */}
                  <View style={[styles.forkStemWrapSmall, isFocused && styles.forkStemWrapSmallFocused]}>
                    <View style={[styles.forkStemVerticalSmall, { borderColor: '#38bdf8' }]} />
                    <View style={[styles.forkBarHorizontalSmall, { borderColor: '#38bdf8' }]} />
                    <View style={[styles.forkDropLeftSmall, { borderColor: '#38bdf8' }]} />
                    <View style={[styles.forkDropRightSmall, { borderColor: '#38bdf8' }]} />
                  </View>

                  {/* Gen 3 Grandparents */}
                  <View style={[styles.treeLevelRowG3, isFocused && styles.treeLevelRowG3Focused]}>
                    <View style={styles.g3CardWrap}>
                      {renderDiagramCard(
                        sireTree.g3_top1,
                        isFocused ? styles.cardG3StyleFocused : styles.cardG3Style
                      )}
                    </View>
                    <View style={styles.g3CardWrap}>
                      {renderDiagramCard(
                        sireTree.g3_top2,
                        isFocused ? styles.cardG3StyleFocused : styles.cardG3Style
                      )}
                    </View>
                  </View>
                </View>

                {/* Gen 2 Sağ (Babanın Annesi) */}
                <View style={styles.treeSubBranch}>
                  <View style={styles.treeLevelCardWrap}>
                    {renderDiagramCard(
                      sireTree.g2_bot,
                      isFocused ? styles.cardG2StyleFocused : styles.cardG2Style
                    )}
                  </View>

                  {/* Fork to Gen 3 */}
                  <View style={[styles.forkStemWrapSmall, isFocused && styles.forkStemWrapSmallFocused]}>
                    <View style={[styles.forkStemVerticalSmall, { borderColor: '#f472b6' }]} />
                    <View style={[styles.forkBarHorizontalSmall, { borderColor: '#f472b6' }]} />
                    <View style={[styles.forkDropLeftSmall, { borderColor: '#f472b6' }]} />
                    <View style={[styles.forkDropRightSmall, { borderColor: '#f472b6' }]} />
                  </View>

                  {/* Gen 3 Grandparents */}
                  <View style={[styles.treeLevelRowG3, isFocused && styles.treeLevelRowG3Focused]}>
                    <View style={styles.g3CardWrap}>
                      {renderDiagramCard(
                        sireTree.g3_bot1,
                        isFocused ? styles.cardG3StyleFocused : styles.cardG3Style
                      )}
                    </View>
                    <View style={styles.g3CardWrap}>
                      {renderDiagramCard(
                        sireTree.g3_bot2,
                        isFocused ? styles.cardG3StyleFocused : styles.cardG3Style
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* SAĞ AĞAÇ: ANNE HATTI (Dam Tree) */}
          {showDam && (
            <View style={[styles.branchTreeHalf, isFocused && styles.branchTreeHalfFocused]}>
              {/* Gen 1: Anne Card */}
              <View style={styles.treeLevelCardWrap}>
                {renderDiagramCard(
                  damTree.g1,
                  isFocused ? styles.cardG1StyleFocused : styles.cardG1Style
                )}
              </View>

              {/* Fork to Gen 2 */}
              <View style={[styles.forkStemWrap, isFocused && styles.forkStemWrapFocused]}>
                <View style={[styles.forkStemVertical, { borderColor: '#f472b6' }]} />
                <View style={[styles.forkBarHorizontal, { borderColor: '#f472b6' }]} />
                <View style={[styles.forkDropLeft, { borderColor: '#f472b6' }]} />
                <View style={[styles.forkDropRight, { borderColor: '#f472b6' }]} />
              </View>

              {/* Gen 2: Kısrak Babası & Annenin Annesi */}
              <View style={[styles.treeLevelRowG2, isFocused && styles.treeLevelRowG2Focused]}>
                {/* Gen 2 Sol (Kısrak Babası) */}
                <View style={styles.treeSubBranch}>
                  <View style={styles.treeLevelCardWrap}>
                    {renderDiagramCard(
                      damTree.g2_top,
                      isFocused ? styles.cardG2StyleFocused : styles.cardG2Style
                    )}
                  </View>

                  {/* Fork to Gen 3 */}
                  <View style={[styles.forkStemWrapSmall, isFocused && styles.forkStemWrapSmallFocused]}>
                    <View style={[styles.forkStemVerticalSmall, { borderColor: '#38bdf8' }]} />
                    <View style={[styles.forkBarHorizontalSmall, { borderColor: '#38bdf8' }]} />
                    <View style={[styles.forkDropLeftSmall, { borderColor: '#38bdf8' }]} />
                    <View style={[styles.forkDropRightSmall, { borderColor: '#38bdf8' }]} />
                  </View>

                  {/* Gen 3 Grandparents */}
                  <View style={[styles.treeLevelRowG3, isFocused && styles.treeLevelRowG3Focused]}>
                    <View style={styles.g3CardWrap}>
                      {renderDiagramCard(
                        damTree.g3_top1,
                        isFocused ? styles.cardG3StyleFocused : styles.cardG3Style
                      )}
                    </View>
                    <View style={styles.g3CardWrap}>
                      {renderDiagramCard(
                        damTree.g3_top2,
                        isFocused ? styles.cardG3StyleFocused : styles.cardG3Style
                      )}
                    </View>
                  </View>
                </View>

                {/* Gen 2 Sağ (Annenin Annesi) */}
                <View style={styles.treeSubBranch}>
                  <View style={styles.treeLevelCardWrap}>
                    {renderDiagramCard(
                      damTree.g2_bot,
                      isFocused ? styles.cardG2StyleFocused : styles.cardG2Style
                    )}
                  </View>

                  {/* Fork to Gen 3 */}
                  <View style={[styles.forkStemWrapSmall, isFocused && styles.forkStemWrapSmallFocused]}>
                    <View style={[styles.forkStemVerticalSmall, { borderColor: '#f472b6' }]} />
                    <View style={[styles.forkBarHorizontalSmall, { borderColor: '#f472b6' }]} />
                    <View style={[styles.forkDropLeftSmall, { borderColor: '#f472b6' }]} />
                    <View style={[styles.forkDropRightSmall, { borderColor: '#f472b6' }]} />
                  </View>

                  {/* Gen 3 Grandparents */}
                  <View style={[styles.treeLevelRowG3, isFocused && styles.treeLevelRowG3Focused]}>
                    <View style={styles.g3CardWrap}>
                      {renderDiagramCard(
                        damTree.g3_bot1,
                        isFocused ? styles.cardG3StyleFocused : styles.cardG3Style
                      )}
                    </View>
                    <View style={styles.g3CardWrap}>
                      {renderDiagramCard(
                        damTree.g3_bot2,
                        isFocused ? styles.cardG3StyleFocused : styles.cardG3Style
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  // --- 2. GÖRÜNÜM: PREMIUM ESTETİK PEDİGRİ TABLOSU (Aesthetic Pedigree Table) ---
  const renderTableCard = (node: PedigreeNode) => {
    const isMale = node.gender === 'male';
    const accentColor = isMale ? '#38bdf8' : '#f472b6';
    const bgTint = isMale ? 'rgba(56, 189, 248, 0.08)' : 'rgba(244, 114, 182, 0.08)';
    const cardBorderColor = isMale ? 'rgba(56, 189, 248, 0.28)' : 'rgba(244, 114, 182, 0.28)';
    const isValid = node.name && node.name !== '-';
    const isGen3 = node.gen === 3;

    if (isGen3) {
      return (
        <Pressable
          onPress={() => isValid && openTjkHorseSearch(node.raw || node.name)}
          disabled={!isValid}
          accessibilityRole="button"
          accessibilityLabel={`${node.role}: ${node.name}`}
          style={({ pressed }) => [
            styles.tCard,
            styles.tCardG3,
            {
              backgroundColor: bgTint,
              borderColor: isValid ? cardBorderColor : border,
              opacity: isValid ? 1 : 0.45,
            },
            isValid && {
              borderLeftWidth: 3,
              borderLeftColor: accentColor,
              ...Platform.select({
                web: {
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                } as any,
                default: {},
              }),
            },
            pressed && isValid && {
              opacity: 0.85,
              transform: [{ scale: 0.99 }],
            },
          ]}
        >
          {/* 1. ÜST SATIR: Rol Bilgisi (Sol) + Don / Yıl / Ülke & Link (Sağ) */}
          <View style={styles.tCardHeaderG3}>
            <View style={[styles.tRoleBadge, { backgroundColor: isMale ? 'rgba(56, 189, 248, 0.12)' : 'rgba(244, 114, 182, 0.12)' }]}>
              <Ionicons
                name={isMale ? 'male' : 'female'}
                size={9.5}
                color={accentColor}
              />
              <Text style={[styles.tRoleText, { color: accentColor }]}>
                {node.role}
              </Text>
            </View>

            <View style={styles.tMetaRowInline}>
              {node.coat ? (
                <View style={[styles.tMetaBadge, { backgroundColor: `${accentColor}18` }]}>
                  <Text style={[styles.tMetaBadgeText, { color: accentColor, fontWeight: '700' }]}>
                    {node.coat.toUpperCase()}
                  </Text>
                </View>
              ) : null}

              {node.year ? (
                <View style={[styles.tMetaBadge, { backgroundColor: `${textSecondary}15` }]}>
                  <Ionicons name="calendar-outline" size={8.5} color={textSecondary} />
                  <Text style={[styles.tMetaBadgeText, { color: textSecondary }]}>
                    {node.year}
                  </Text>
                </View>
              ) : null}

              {node.country ? (
                <View style={[styles.tMetaBadge, { backgroundColor: `${textSecondary}15` }]}>
                  <Text style={[styles.tMetaBadgeText, { color: textSecondary }]}>
                    {node.country}
                  </Text>
                </View>
              ) : null}

              {isValid ? (
                <Ionicons name="open-outline" size={10} color={textMuted} style={{ marginLeft: 2 }} />
              ) : null}
            </View>
          </View>

          {/* 2. ALT SATIR: At İsmi */}
          <Text
            style={[
              styles.tNodeName,
              styles.tNodeNameG3,
              { color: text },
            ]}
            numberOfLines={1}
          >
            {node.name}
          </Text>
        </Pressable>
      );
    }

    return (
      <Pressable
        onPress={() => isValid && openTjkHorseSearch(node.raw || node.name)}
        disabled={!isValid}
        accessibilityRole="button"
        accessibilityLabel={`${node.role}: ${node.name}`}
        style={({ pressed }) => [
          styles.tCard,
          {
            backgroundColor: bgTint,
            borderColor: isValid ? cardBorderColor : border,
            opacity: isValid ? 1 : 0.45,
          },
          isValid && {
            borderLeftWidth: 3,
            borderLeftColor: accentColor,
            ...Platform.select({
              web: {
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              } as any,
              default: {},
            }),
          },
          pressed && isValid && {
            opacity: 0.85,
            transform: [{ scale: 0.99 }],
          },
        ]}
      >
        {/* Header Pill & Link Icon */}
        <View style={styles.tCardHeader}>
          <View style={[styles.tRoleBadge, { backgroundColor: isMale ? 'rgba(56, 189, 248, 0.12)' : 'rgba(244, 114, 182, 0.12)' }]}>
            <Ionicons
              name={isMale ? 'male' : 'female'}
              size={10.5}
              color={accentColor}
            />
            <Text style={[styles.tRoleText, { color: accentColor }]}>
              {node.role}
            </Text>
          </View>

          {isValid ? (
            <Ionicons name="open-outline" size={10} color={textMuted} />
          ) : null}
        </View>

        {/* Horse Name */}
        <Text
          style={[
            styles.tNodeName,
            { color: text },
            node.gen === 1 && styles.tNodeNameG1,
            node.gen === 2 && styles.tNodeNameG2,
          ]}
          numberOfLines={2}
        >
          {node.name}
        </Text>

        {/* Metadata Chips: Year & Coat */}
        {isValid && (node.year || node.coat || node.country) ? (
          <View style={styles.tMetaRow}>
            {node.coat ? (
              <View style={[styles.tMetaBadge, { backgroundColor: `${accentColor}18` }]}>
                <Text style={[styles.tMetaBadgeText, { color: accentColor, fontWeight: '700' }]}>
                  {node.coat.toUpperCase()}
                </Text>
              </View>
            ) : null}

            {node.year ? (
              <View style={[styles.tMetaBadge, { backgroundColor: `${textSecondary}15` }]}>
                <Ionicons name="calendar-outline" size={8.5} color={textSecondary} />
                <Text style={[styles.tMetaBadgeText, { color: textSecondary }]}>
                  {node.year}
                </Text>
              </View>
            ) : null}

            {node.country ? (
              <View style={[styles.tMetaBadge, { backgroundColor: `${textSecondary}15` }]}>
                <Text style={[styles.tMetaBadgeText, { color: textSecondary }]}>
                  {node.country}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </Pressable>
    );
  };

  const renderAestheticTable = () => {
    const showSire = activeBranch === 'all' || activeBranch === 'sire';
    const showDam = activeBranch === 'all' || activeBranch === 'dam';

    return (
      <View style={styles.tjkTableWrap}>
        {/* Kuşak Sütun Başlıkları */}
        <View style={styles.tjkHeaderRow}>
          <View style={styles.tCol1}>
            <View style={[styles.tHeaderBadge, { borderColor: border, backgroundColor: `${surface}50` }]}>
              <Text style={[styles.tHeaderTitle, { color: text }]}>1. KUŞAK</Text>
              <Text style={[styles.tHeaderSub, { color: textSecondary }]}>Ebeveynler (%50)</Text>
            </View>
          </View>
          <View style={styles.tCol2}>
            <View style={[styles.tHeaderBadge, { borderColor: border, backgroundColor: `${surface}50` }]}>
              <Text style={[styles.tHeaderTitle, { color: text }]}>2. KUŞAK</Text>
              <Text style={[styles.tHeaderSub, { color: textSecondary }]}>Dede & Nine (%25)</Text>
            </View>
          </View>
          <View style={styles.tCol3}>
            <View style={[styles.tHeaderBadge, { borderColor: border, backgroundColor: `${surface}50` }]}>
              <Text style={[styles.tHeaderTitle, { color: text }]}>3. KUŞAK</Text>
              <Text style={[styles.tHeaderSub, { color: textSecondary }]}>Büyük Atalar (%12.5)</Text>
            </View>
          </View>
        </View>

        {/* Tablo Gövdesi (Glassmorphic Grid) */}
        <View style={styles.tGridContainer}>
          {/* SÜTUN 1: 1. KUŞAK */}
          <View style={styles.tCol1}>
            {showSire && <View style={styles.tCellSpan4}>{renderTableCard(sireTree.g1)}</View>}
            {showDam && <View style={styles.tCellSpan4}>{renderTableCard(damTree.g1)}</View>}
          </View>

          {/* SÜTUN 2: 2. KUŞAK */}
          <View style={styles.tCol2}>
            {showSire && (
              <>
                <View style={styles.tCellSpan2}>{renderTableCard(sireTree.g2_top)}</View>
                <View style={styles.tCellSpan2}>{renderTableCard(sireTree.g2_bot)}</View>
              </>
            )}
            {showDam && (
              <>
                <View style={styles.tCellSpan2}>{renderTableCard(damTree.g2_top)}</View>
                <View style={styles.tCellSpan2}>{renderTableCard(damTree.g2_bot)}</View>
              </>
            )}
          </View>

          {/* SÜTUN 3: 3. KUŞAK */}
          <View style={styles.tCol3}>
            {showSire && (
              <>
                <View style={styles.tCellSpan1}>{renderTableCard(sireTree.g3_top1)}</View>
                <View style={styles.tCellSpan1}>{renderTableCard(sireTree.g3_top2)}</View>
                <View style={styles.tCellSpan1}>{renderTableCard(sireTree.g3_bot1)}</View>
                <View style={styles.tCellSpan1}>{renderTableCard(sireTree.g3_bot2)}</View>
              </>
            )}
            {showDam && (
              <>
                <View style={styles.tCellSpan1}>{renderTableCard(damTree.g3_top1)}</View>
                <View style={styles.tCellSpan1}>{renderTableCard(damTree.g3_top2)}</View>
                <View style={styles.tCellSpan1}>{renderTableCard(damTree.g3_bot1)}</View>
                <View style={styles.tCellSpan1}>{renderTableCard(damTree.g3_bot2)}</View>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.wrap}>
      {/* Header & Title */}
      <View style={styles.sectionHeader}>
        <View style={[styles.iconWrap, { backgroundColor: `${primary}15` }]}>
          <Ionicons name="git-network" size={18} color={primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: text }]}>
            Soy Ağacı & Pedigri Şeması
          </Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            {horseName ? `${horseName} için ` : ''}TJK kayıtlı 3 kuşak tam ata ağacı
          </Text>
        </View>

        {/* View Mode Switcher */}
        <View style={[styles.viewSwitchWrap, { backgroundColor: surface, borderColor: border }]}>
          <Pressable
            onPress={() => setViewMode('diagram')}
            style={[
              styles.viewSwitchBtn,
              viewMode === 'diagram' && { backgroundColor: `${primary}15` },
            ]}
          >
            <Ionicons
              name="git-network-outline"
              size={13}
              color={viewMode === 'diagram' ? primary : textSecondary}
            />
            <Text
              style={[
                styles.viewSwitchText,
                { color: viewMode === 'diagram' ? primary : textSecondary },
              ]}
            >
              Soy Ağacı
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setViewMode('table')}
            style={[
              styles.viewSwitchBtn,
              viewMode === 'table' && { backgroundColor: `${primary}15` },
            ]}
          >
            <Ionicons
              name="grid-outline"
              size={13}
              color={viewMode === 'table' ? primary : textSecondary}
            />
            <Text
              style={[
                styles.viewSwitchText,
                { color: viewMode === 'table' ? primary : textSecondary },
              ]}
            >
              Tablo
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Render Selected View Mode */}
      {viewMode === 'diagram' ? (
        <View style={styles.diagramViewportWrap}>
          {/* Quick Lineage Jump Bar & Pan Controls */}
          <View style={styles.diagramToolbar}>
            <View style={styles.branchFilterGroup}>
              <Pressable
                onPress={() => handleBranchChange('all')}
                style={[
                  styles.branchFilterBtn,
                  activeBranch === 'all' && {
                    backgroundColor: `${primary}18`,
                    borderColor: primary,
                  },
                ]}
              >
                <Ionicons
                  name="git-network-outline"
                  size={12}
                  color={activeBranch === 'all' ? primary : textSecondary}
                />
                <Text
                  style={[
                    styles.branchFilterText,
                    { color: activeBranch === 'all' ? primary : textSecondary },
                  ]}
                >
                  Tüm Ağaç
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleBranchChange('sire')}
                style={[
                  styles.branchFilterBtn,
                  activeBranch === 'sire' && {
                    backgroundColor: 'rgba(56, 189, 248, 0.16)',
                    borderColor: '#38bdf8',
                  },
                ]}
              >
                <Ionicons
                  name="male"
                  size={12}
                  color={activeBranch === 'sire' ? '#38bdf8' : textSecondary}
                />
                <Text
                  style={[
                    styles.branchFilterText,
                    { color: activeBranch === 'sire' ? '#38bdf8' : textSecondary },
                  ]}
                >
                  Baba Hattı
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleBranchChange('dam')}
                style={[
                  styles.branchFilterBtn,
                  activeBranch === 'dam' && {
                    backgroundColor: 'rgba(244, 114, 182, 0.16)',
                    borderColor: '#f472b6',
                  },
                ]}
              >
                <Ionicons
                  name="female"
                  size={12}
                  color={activeBranch === 'dam' ? '#f472b6' : textSecondary}
                />
                <Text
                  style={[
                    styles.branchFilterText,
                    { color: activeBranch === 'dam' ? '#f472b6' : textSecondary },
                  ]}
                >
                  Anne Hattı
                </Text>
              </Pressable>
            </View>

            {/* Slide Arrows */}
            <View style={styles.arrowControls}>
              <Pressable
                onPress={() => handleScrollStep('left')}
                style={({ pressed }) => [
                  styles.arrowBtn,
                  { backgroundColor: surface, borderColor: border },
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityLabel="Sola kaydır"
              >
                <Ionicons name="chevron-back" size={13} color={text} />
              </Pressable>
              <Pressable
                onPress={() => handleScrollStep('right')}
                style={({ pressed }) => [
                  styles.arrowBtn,
                  { backgroundColor: surface, borderColor: border },
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityLabel="Sağa kaydır"
              >
                <Ionicons name="chevron-forward" size={13} color={text} />
              </Pressable>
            </View>
          </View>

          {/* Mouse Drag Pan Canvas Container */}
          <View
            style={[
              styles.panCanvasWrap,
              Platform.select({
                web: {
                  cursor: 'grab',
                  userSelect: 'none',
                } as any,
                default: {},
              }),
            ]}
            {...(Platform.OS === 'web'
              ? {
                  onMouseDown: (e: any) => {
                    isDraggingRef.current = true;
                    startXRef.current = e.pageX;
                    scrollLeftRef.current = currentScrollXRef.current;
                    if (e.currentTarget) e.currentTarget.style.cursor = 'grabbing';
                  },
                  onMouseMove: (e: any) => {
                    if (!isDraggingRef.current) return;
                    const walk = (e.pageX - startXRef.current) * 1.5;
                    const target = scrollLeftRef.current - walk;
                    scrollRef.current?.scrollTo({ x: Math.max(0, target), animated: false });
                  },
                  onMouseUp: (e: any) => {
                    isDraggingRef.current = false;
                    if (e.currentTarget) e.currentTarget.style.cursor = 'grab';
                  },
                  onMouseLeave: (e: any) => {
                    isDraggingRef.current = false;
                    if (e.currentTarget) e.currentTarget.style.cursor = 'grab';
                  },
                }
              : {})}
          >
            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContainer}
              scrollEventThrottle={16}
              onScroll={(e) => {
                const x = e.nativeEvent.contentOffset.x;
                currentScrollXRef.current = x;
                const max = e.nativeEvent.contentSize.width - e.nativeEvent.layoutMeasurement.width;
                if (max > 0) {
                  setScrollProgress(x / max);
                  setCanScroll(true);
                }
              }}
              style={Platform.select({
                web: {
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                } as any,
                default: {},
              })}
            >
              {renderTreeDiagram()}
            </ScrollView>
          </View>
        </View>
      ) : (
        <ScrollView
          horizontal={!isWide}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={!isWide ? styles.mobileScrollContainer : undefined}
          style={Platform.select({
            web: {
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            } as any,
            default: {},
          })}
        >
          {renderAestheticTable()}
        </ScrollView>
      )}

      {/* Footer Info & Legend */}
      <View style={[styles.footerLegend, { borderColor: border }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: '#38bdf8' }]} />
          <Text style={[styles.legendText, { color: textSecondary }]}>
            ♂ Erkek Hat (Aygır)
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: '#f472b6' }]} />
          <Text style={[styles.legendText, { color: textSecondary }]}>
            ♀ Dişi Hat (Kısrak)
          </Text>
        </View>

        <View style={styles.legendItem}>
          <Ionicons name="open-outline" size={12} color={textMuted} />
          <Text style={[styles.legendText, { color: textSecondary }]}>
            Atlardan herhangi birine tıklayarak TJK resmi yarışlarını ve yavru kayıtlarını açabilirsiniz
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  viewSwitchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
    gap: 2,
  },
  viewSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewSwitchText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // --- TREE DIAGRAM STYLES ---
  diagramViewportWrap: {
    width: '100%',
    gap: 8,
  },
  diagramToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  branchFilterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  branchFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.15s ease' } as any,
      default: {},
    }),
  },
  branchFilterText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  arrowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  arrowBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.15s ease' } as any,
      default: {},
    }),
  },
  panCanvasWrap: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  scrollContainer: {
    width: '100%',
    minWidth: '100%',
    paddingVertical: 1,
  },
  treeDiagramContainer: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
    minWidth: 980,
    alignSelf: 'stretch',
  },
  treeDiagramContainerFocused: {
    minWidth: '100%',
    maxWidth: 860,
    paddingVertical: 20,
    paddingHorizontal: 18,
  },
  levelRootWrap: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  rootCardContainer: {
    alignItems: 'center',
    zIndex: 2,
    width: '100%',
  },
  rootCardStyle: {
    width: '100%',
    maxWidth: 260,
  },
  rootCardStyleFocused: {
    width: '100%',
    maxWidth: 300,
  },
  rootStemLine: {
    width: 1.5,
    height: 12,
    backgroundColor: '#9ca3af',
  },
  rootDirectLine: {
    width: 2,
    height: 18,
    borderRadius: 1,
  },
  rootForkWrap: {
    width: '50%',
    height: 14,
    position: 'relative',
  },
  rootForkHorizontal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
  },
  rootDropLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderLeftWidth: 1.5,
  },
  rootDropRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    borderRightWidth: 1.5,
  },
  mainBranchesRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 16,
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  mainBranchesRowFocused: {
    justifyContent: 'center',
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  branchTreeHalf: {
    flex: 1,
    alignItems: 'center',
  },
  branchTreeHalfFocused: {
    width: '100%',
    maxWidth: 800,
    flex: 1,
  },
  treeLevelCardWrap: {
    width: '100%',
    alignItems: 'center',
    zIndex: 2,
  },
  treeLevelRowG2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
    alignItems: 'stretch',
  },
  treeLevelRowG2Focused: {
    gap: 14,
  },
  treeLevelRowG3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    width: '100%',
    alignItems: 'stretch',
  },
  treeLevelRowG3Focused: {
    gap: 10,
  },
  treeSubBranch: {
    flex: 1,
    alignItems: 'center',
  },
  g3CardWrap: {
    flex: 1,
    alignItems: 'stretch',
  },
  forkStemWrap: {
    width: '50%',
    height: 14,
    position: 'relative',
    marginVertical: 2,
  },
  forkStemWrapFocused: {
    width: '50%',
    height: 16,
    position: 'relative',
    marginVertical: 2,
  },
  forkStemWrapSmall: {
    width: '50%',
    height: 12,
    position: 'relative',
    marginVertical: 2,
  },
  forkStemWrapSmallFocused: {
    width: '50%',
    height: 14,
    position: 'relative',
    marginVertical: 2,
  },
  forkStemVertical: {
    position: 'absolute',
    top: 0,
    left: '50%',
    height: 7,
    borderLeftWidth: 1.5,
    transform: [{ translateX: -0.75 }],
  },
  forkBarHorizontal: {
    position: 'absolute',
    top: 7,
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
  },
  forkDropLeft: {
    position: 'absolute',
    top: 7,
    left: 0,
    bottom: 0,
    borderLeftWidth: 1.5,
  },
  forkDropRight: {
    position: 'absolute',
    top: 7,
    right: 0,
    bottom: 0,
    borderRightWidth: 1.5,
  },
  forkStemVerticalSmall: {
    position: 'absolute',
    top: 0,
    left: '50%',
    height: 6,
    borderLeftWidth: 1.5,
    transform: [{ translateX: -0.75 }],
  },
  forkBarHorizontalSmall: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
  },
  forkDropLeftSmall: {
    position: 'absolute',
    top: 6,
    left: 0,
    bottom: 0,
    borderLeftWidth: 1.5,
  },
  forkDropRightSmall: {
    position: 'absolute',
    top: 6,
    right: 0,
    bottom: 0,
    borderRightWidth: 1.5,
  },
  dNodeCard: {
    borderRadius: 9,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    justifyContent: 'center',
    width: '100%',
  },
  dCardG0: {
    minHeight: 64,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dCardG1: {
    minHeight: 60,
    width: '100%',
    maxWidth: 240,
    alignSelf: 'center',
  },
  dCardG2: {
    minHeight: 58,
    width: '100%',
    maxWidth: 200,
    alignSelf: 'center',
  },
  dCardG3: {
    minHeight: 62,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  cardG1Style: {
    width: '100%',
    maxWidth: 240,
  },
  cardG1StyleFocused: {
    width: '100%',
    maxWidth: 300,
    minHeight: 64,
  },
  cardG2Style: {
    width: '100%',
    maxWidth: 200,
  },
  cardG2StyleFocused: {
    width: '100%',
    maxWidth: 250,
    minHeight: 60,
  },
  cardG3Style: {},
  cardG3StyleFocused: {
    minHeight: 62,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  dCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    gap: 3,
  },
  dRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
  },
  dRoleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  dRoleTextG3: {
    fontSize: 9,
    fontWeight: '700',
  },
  dGenBadge: {
    fontSize: 9.5,
    fontWeight: '700',
    marginLeft: 'auto',
    marginRight: 2,
  },
  dNodeName: {
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  dNodeNameG0: {
    fontSize: 15.5,
    lineHeight: 19,
    fontWeight: '900',
    marginTop: 1,
  },
  dNodeNameG1: {
    fontSize: 13.5,
    lineHeight: 17,
  },
  dNodeNameG2: {
    fontSize: 12,
    lineHeight: 15,
  },
  dNodeNameG3: {
    fontSize: 11,
    lineHeight: 14,
  },
  dMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginTop: 2,
  },
  dMetaPlaceholder: {
    height: 6,
  },
  dMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 3.5,
    paddingVertical: 0.5,
    borderRadius: 3,
  },
  dMetaBadgeText: {
    fontSize: 8,
    fontWeight: '600',
  },

  // --- AESTHETIC PEDIGREE TABLE STYLES ---
  mobileScrollContainer: {
    paddingBottom: 8,
  },
  tjkTableWrap: {
    width: '100%',
    minWidth: 620,
  },
  tjkHeaderRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  tCol1: {
    flex: 1.1,
    gap: 6,
  },
  tCol2: {
    flex: 1.1,
    gap: 6,
  },
  tCol3: {
    flex: 1.25,
    gap: 6,
  },
  tHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  tHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  tHeaderSub: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  tGridContainer: {
    flexDirection: 'row',
    gap: 6,
    height: 420,
  },
  tCellSpan4: {
    flex: 4,
  },
  tCellSpan2: {
    flex: 2,
  },
  tCellSpan1: {
    flex: 1,
  },
  tCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 4.5,
    paddingHorizontal: 8,
    justifyContent: 'center',
    gap: 2,
  },
  tCardG3: {
    paddingVertical: 4.5,
    paddingHorizontal: 8,
    justifyContent: 'center',
    gap: 2,
  },
  tCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  tCardHeaderG3: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  tMetaRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  tRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tRoleText: {
    fontSize: 9,
    fontWeight: '800',
  },
  tNodeName: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  tNodeNameG1: {
    fontSize: 14.5,
    lineHeight: 18,
    fontWeight: '900',
  },
  tNodeNameG2: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
  },
  tNodeNameG3: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '800',
  },
  tMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 3,
    marginTop: 2,
  },
  tMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tMetaBadgeText: {
    fontSize: 8.5,
    fontWeight: '600',
  },

  // Footer Legend
  footerLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 2.5,
  },
  legendText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
});
